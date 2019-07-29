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

#pragma once

#include "daemon/MoneroDaemonModel.h"

using namespace std;
using namespace monero;

/**
 * Public library interface.
 */
namespace monero {

  /**
   * Models a result of syncing a wallet.
   */
  struct MoneroSyncResult {
    uint64_t numBlocksFetched;
    bool receivedMoney;
    MoneroSyncResult() {}
    MoneroSyncResult(const uint64_t numBlocksFetched, const bool receivedMoney) : numBlocksFetched(numBlocksFetched), receivedMoney(receivedMoney) {}
  };

  /**
   * Models a Monero subaddress.
   */
  struct MoneroSubaddress : public SerializableStruct {
    boost::optional<uint32_t> accountIndex;
    boost::optional<uint32_t> index;
    boost::optional<string> address;
    boost::optional<string> label;
    boost::optional<uint64_t> balance;
    boost::optional<uint64_t> unlockedBalance;
    boost::optional<uint32_t> numUnspentOutputs;
    boost::optional<bool> isUsed;
    boost::optional<uint32_t> numBlocksToUnlock;
//    BEGIN_KV_SERIALIZE_MAP()
//      KV_SERIALIZE(accountIndex)
//      KV_SERIALIZE(index)
//      KV_SERIALIZE(address)
//      KV_SERIALIZE(label)
//      KV_SERIALIZE(balance)
//      KV_SERIALIZE(unlockedBalance)
//      KV_SERIALIZE(numUnspentOutputs)
//      KV_SERIALIZE(isUsed)
//      KV_SERIALIZE(numBlocksToUnlock)
//    END_KV_SERIALIZE_MAP()

    boost::property_tree::ptree toPropertyTree() const;
    //void merge(const shared_ptr<MoneroSubaddress>& self, const shared_ptr<MoneroSubaddress>& other);
  };

  /**
   * Models a Monero account.
   */
  struct MoneroAccount : public SerializableStruct {
    boost::optional<uint32_t> index;
    boost::optional<string> primaryAddress;
    boost::optional<uint64_t> balance;
    boost::optional<uint64_t> unlockedBalance;
    boost::optional<string> tag;
    vector<MoneroSubaddress> subaddresses;
//    BEGIN_KV_SERIALIZE_MAP()
//      KV_SERIALIZE(index)
//      KV_SERIALIZE(primaryAddress)
//      KV_SERIALIZE(label)
//      KV_SERIALIZE(balance)
//      KV_SERIALIZE(unlockedBalance)
//      KV_SERIALIZE(tag)
//      KV_SERIALIZE(subaddresses)
//    END_KV_SERIALIZE_MAP()

    boost::property_tree::ptree toPropertyTree() const;
  };

  // forward declarations
  struct MoneroTxWallet;
  struct MoneroTxRequest;

  /**
   * Models an outgoing transfer destination.
   */
  struct MoneroDestination {
    boost::optional<string> address;
    boost::optional<uint64_t> amount;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Models a base transfer of funds to or from the wallet.
   */
  struct MoneroTransfer : SerializableStruct {
    shared_ptr<MoneroTxWallet> tx;
    boost::optional<uint64_t> amount;
    boost::optional<uint32_t> accountIndex;
    boost::optional<uint32_t> numSuggestedConfirmations;

    MoneroTransfer();
    MoneroTransfer(const MoneroTransfer& transfer);           // deep copy constructor
    virtual boost::optional<bool> getIsIncoming() const = 0;  // derived class must implement
    shared_ptr<MoneroTransfer> copy() const;                  // not virtual in order for subclasses to return shared_ptr of derived types
    boost::optional<bool> getIsOutgoing() const {
			if (getIsIncoming() == boost::none) return boost::none;
      return !(*getIsIncoming());
    }
    boost::property_tree::ptree toPropertyTree() const;
    void merge(const shared_ptr<MoneroTransfer>& self, const shared_ptr<MoneroTransfer>& other);
  };

  /**
   * Models an incoming transfer of funds to the wallet.
   */
  struct MoneroIncomingTransfer : public MoneroTransfer {
    boost::optional<uint32_t> subaddressIndex;
    boost::optional<string> address;

    MoneroIncomingTransfer();
    MoneroIncomingTransfer(const MoneroIncomingTransfer& transfer); // deep copy constructor
    shared_ptr<MoneroIncomingTransfer> copy() const;
    boost::optional<bool> getIsIncoming() const;
    boost::property_tree::ptree toPropertyTree() const;
    void merge(const shared_ptr<MoneroTransfer>& self, const shared_ptr<MoneroTransfer>& other);
    void merge(const shared_ptr<MoneroIncomingTransfer>& self, const shared_ptr<MoneroIncomingTransfer>& other);
  };

  /**
   * Models an outgoing transfer of funds from the wallet.
   */
  struct MoneroOutgoingTransfer : public MoneroTransfer {
    vector<uint32_t> subaddressIndices;
    vector<string> addresses;
    vector<shared_ptr<MoneroDestination>> destinations;

    MoneroOutgoingTransfer();
    MoneroOutgoingTransfer(const MoneroOutgoingTransfer& transfer);
    shared_ptr<MoneroOutgoingTransfer> copy() const;
    boost::optional<bool> getIsIncoming() const;
    boost::property_tree::ptree toPropertyTree() const;
    void merge(const shared_ptr<MoneroTransfer>& self, const shared_ptr<MoneroTransfer>& other);
    void merge(const shared_ptr<MoneroOutgoingTransfer>& self, const shared_ptr<MoneroOutgoingTransfer>& other);
  };

  /**
   * Configures a request to retrieve transfers.
   *
   * All transfers are returned except those that do not meet the criteria defined in this request.
   */
  struct MoneroTransferRequest : public MoneroTransfer {
    boost::optional<bool> isIncoming;
    boost::optional<string> address;
    vector<string> addresses;
    boost::optional<uint32_t> subaddressIndex;
    vector<uint32_t> subaddressIndices;
    vector<shared_ptr<MoneroDestination>> destinations;
    boost::optional<bool> hasDestinations;
    boost::optional<shared_ptr<MoneroTxRequest>> txRequest;

    MoneroTransferRequest();
    MoneroTransferRequest(const MoneroTransferRequest& request);
    shared_ptr<MoneroTransferRequest> copy() const;
    boost::optional<bool> getIsIncoming() const;
    boost::property_tree::ptree toPropertyTree() const;
    bool meetsCriteria(MoneroTransfer* transfer) const;
  };

  /**
   * Models a Monero output with wallet extensions.
   */
  struct MoneroOutputWallet : public MoneroOutput {
    boost::optional<uint32_t> accountIndex;
    boost::optional<uint32_t> subaddressIndex;
    boost::optional<bool> isSpent;
    boost::optional<bool> isUnlocked;
    boost::optional<bool> isFrozen;

    MoneroOutputWallet();
    MoneroOutputWallet(const MoneroOutputWallet& output); // deep copy constructor
    shared_ptr<MoneroOutputWallet> copy() const;
    boost::property_tree::ptree toPropertyTree() const;
    void merge(const shared_ptr<MoneroOutput>& self, const shared_ptr<MoneroOutput>& other);
    void merge(const shared_ptr<MoneroOutputWallet>& self, const shared_ptr<MoneroOutputWallet>& other);
  };

  /**
   * Configures a request to retrieve wallet outputs (i.e. outputs that the wallet has or had the
   * ability to spend).
   *
   * All outputs are returned except those that do not meet the criteria defined in this request.
   */
  struct MoneroOutputRequest : public MoneroOutputWallet {
    vector<uint32_t> subaddressIndices;
    boost::optional<shared_ptr<MoneroTxRequest>> txRequest;

    MoneroOutputRequest();
    MoneroOutputRequest(const MoneroOutputRequest& request);  // deep copy constructor
    shared_ptr<MoneroOutputRequest> copy() const;
    boost::property_tree::ptree toPropertyTree() const;
    bool meetsCriteria(MoneroOutputWallet* output) const;
  };

  /**
   * Models a Monero transaction in the context of a wallet.
   */
  struct MoneroTxWallet : public MoneroTx {
    vector<shared_ptr<MoneroIncomingTransfer>> incomingTransfers;
    boost::optional<shared_ptr<MoneroOutgoingTransfer>> outgoingTransfer;
    boost::optional<string> note;

    MoneroTxWallet();
    MoneroTxWallet(const MoneroTxWallet& tx);
    shared_ptr<MoneroTxWallet> copy() const;
    bool getIsIncoming() const;
    bool getIsOutgoing() const;
    boost::property_tree::ptree toPropertyTree() const;
    void merge(const shared_ptr<MoneroTx>& self, const shared_ptr<MoneroTx>& other);
    void merge(const shared_ptr<MoneroTxWallet>& self, const shared_ptr<MoneroTxWallet>& other);
  };

  /**
   * Configures a request to retrieve transactions.
   *
   * All transactions are returned except those that do not meet the criteria defined in this request.
   */
  struct MoneroTxRequest : public MoneroTxWallet {
    boost::optional<bool> isOutgoing;
    boost::optional<bool> isIncoming;
    vector<string> txIds;
    boost::optional<bool> hasPaymentId;
    vector<string> paymentIds;
    boost::optional<uint64_t> height;
    boost::optional<uint64_t> minHeight;
    boost::optional<uint64_t> maxHeight;
    boost::optional<uint64_t> includeOutputs;
    boost::optional<shared_ptr<MoneroTransferRequest>> transferRequest;
    boost::optional<shared_ptr<MoneroOutputRequest>> outputRequest;

    MoneroTxRequest();
    MoneroTxRequest(const MoneroTxRequest& txRequest);
    shared_ptr<MoneroTxRequest> copy() const;
    boost::property_tree::ptree toPropertyTree() const;
    bool meetsCriteria(MoneroTxWallet* tx) const;
  };

  /**
   * Monero integrated address model.
   */
  struct MoneroIntegratedAddress : public SerializableStruct {
    string standardAddress;
    string paymentId;
    string integratedAddress;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Enumerates Monero network types.
   */
  enum MoneroSendPriority : uint8_t {
    DEFAULT = 0,
    UNIMPORTANT,
    NORMAL,
    ELEVATED
  };

  /**
   * Configures a request to send/sweep funds or create a payment URI.
   */
  struct MoneroSendRequest : public SerializableStruct {
    vector<shared_ptr<MoneroDestination>> destinations;
    boost::optional<string> paymentId;
    boost::optional<MoneroSendPriority> priority;
    boost::optional<uint32_t> mixin;
    boost::optional<uint32_t> ringSize;
    boost::optional<uint64_t> fee;
    boost::optional<uint32_t> accountIndex;
    vector<uint32_t> subaddressIndices;
    boost::optional<uint64_t> unlockTime;
    boost::optional<bool> canSplit;
    boost::optional<bool> doNotRelay;
    boost::optional<string> note;
    boost::optional<string> recipientName;
    boost::optional<uint64_t> belowAmount;
    boost::optional<bool> sweepEachSubaddress;
    boost::optional<string> keyImage;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Models results from importing key images.
   */
  struct MoneroKeyImageImportResult : public SerializableStruct {
    boost::optional<uint64_t> height;
    boost::optional<uint64_t> spentAmount;
    boost::optional<uint64_t> unspentAmount;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Base class for results from checking a transaction or reserve proof.
   */
  struct MoneroCheck : public SerializableStruct {
    bool isGood;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Results from checking a transaction key.
   */
  struct MoneroCheckTx : public MoneroCheck {
    boost::optional<bool> inTxPool;
    boost::optional<uint64_t> numConfirmations;
    boost::optional<uint64_t> receivedAmount;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Results from checking a reserve proof.
   */
  struct MoneroCheckReserve : public MoneroCheck  {
    boost::optional<uint64_t> totalAmount;
    boost::optional<uint64_t> unconfirmedSpentAmount;

    boost::property_tree::ptree toPropertyTree() const;
  };
}
