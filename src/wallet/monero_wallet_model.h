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

#include "daemon/monero_daemon_model.h"

using namespace std;
using namespace monero;

/**
 * Public library interface.
 */
namespace monero {

  /**
   * Models a result of syncing a wallet.
   */
  struct monero_sync_result {
    uint64_t num_blocks_fetched;
    bool received_money;
    monero_sync_result() {}
    monero_sync_result(const uint64_t num_blocks_fetched, const bool received_money) : num_blocks_fetched(num_blocks_fetched), received_money(received_money) {}
  };

  /**
   * Models a Monero subaddress.
   */
  struct monero_subaddress : public serializable_struct {
    boost::optional<uint32_t> account_index;
    boost::optional<uint32_t> index;
    boost::optional<string> address;
    boost::optional<string> label;
    boost::optional<uint64_t> balance;
    boost::optional<uint64_t> unlocked_balance;
    boost::optional<uint32_t> num_unspent_outputs;
    boost::optional<bool> is_used;
    boost::optional<uint32_t> num_blocks_to_unlock;
//    BEGIN_KV_SERIALIZE_MAP()
//      KV_SERIALIZE(account_index)
//      KV_SERIALIZE(index)
//      KV_SERIALIZE(address)
//      KV_SERIALIZE(label)
//      KV_SERIALIZE(balance)
//      KV_SERIALIZE(unlocked_balance)
//      KV_SERIALIZE(num_unspent_outputs)
//      KV_SERIALIZE(is_used)
//      KV_SERIALIZE(num_blocks_to_unlock)
//    END_KV_SERIALIZE_MAP()

    boost::property_tree::ptree to_property_tree() const;
    //void merge(const shared_ptr<monero_subaddress>& self, const shared_ptr<monero_subaddress>& other);
  };

  /**
   * Models a Monero account.
   */
  struct monero_account : public serializable_struct {
    boost::optional<uint32_t> index;
    boost::optional<string> primary_address;
    boost::optional<uint64_t> balance;
    boost::optional<uint64_t> unlocked_balance;
    boost::optional<string> tag;
    vector<monero_subaddress> subaddresses;
//    BEGIN_KV_SERIALIZE_MAP()
//      KV_SERIALIZE(index)
//      KV_SERIALIZE(primary_address)
//      KV_SERIALIZE(label)
//      KV_SERIALIZE(balance)
//      KV_SERIALIZE(unlocked_balance)
//      KV_SERIALIZE(tag)
//      KV_SERIALIZE(subaddresses)
//    END_KV_SERIALIZE_MAP()

    boost::property_tree::ptree to_property_tree() const;
  };

  // forward declarations
  struct monero_tx_wallet;
  struct monero_tx_request;

  /**
   * Models an outgoing transfer destination.
   */
  struct monero_destination {
    boost::optional<string> address;
    boost::optional<uint64_t> amount;

    shared_ptr<monero_destination> copy(const shared_ptr<monero_destination>& src, const shared_ptr<monero_destination>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Models a base transfer of funds to or from the wallet.
   */
  struct monero_transfer : serializable_struct {
    shared_ptr<monero_tx_wallet> tx;
    boost::optional<uint64_t> amount;
    boost::optional<uint32_t> account_index;
    boost::optional<uint32_t> num_suggested_confirmations;

    virtual boost::optional<bool> getIsIncoming() const = 0;  // derived class must implement
    shared_ptr<monero_transfer> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    boost::optional<bool> getIsOutgoing() const {
			if (getIsIncoming() == boost::none) return boost::none;
      return !(*getIsIncoming());
    }
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other);
  };

  /**
   * Models an incoming transfer of funds to the wallet.
   */
  struct monero_incoming_transfer : public monero_transfer {
    boost::optional<uint32_t> subaddress_index;
    boost::optional<string> address;

    shared_ptr<monero_incoming_transfer> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    shared_ptr<monero_incoming_transfer> copy(const shared_ptr<monero_incoming_transfer>& src, const shared_ptr<monero_incoming_transfer>& tgt) const;
    boost::optional<bool> getIsIncoming() const;
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other);
    void merge(const shared_ptr<monero_incoming_transfer>& self, const shared_ptr<monero_incoming_transfer>& other);
  };

  /**
   * Models an outgoing transfer of funds from the wallet.
   */
  struct monero_outgoing_transfer : public monero_transfer {
    vector<uint32_t> subaddress_indices;
    vector<string> addresses;
    vector<shared_ptr<monero_destination>> destinations;

    shared_ptr<monero_outgoing_transfer> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    shared_ptr<monero_outgoing_transfer> copy(const shared_ptr<monero_outgoing_transfer>& src, const shared_ptr<monero_outgoing_transfer>& tgt) const;
    boost::optional<bool> getIsIncoming() const;
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other);
    void merge(const shared_ptr<monero_outgoing_transfer>& self, const shared_ptr<monero_outgoing_transfer>& other);
  };

  /**
   * Configures a request to retrieve transfers.
   *
   * All transfers are returned except those that do not meet the criteria defined in this request.
   */
  struct monero_transfer_request : public monero_transfer {
    boost::optional<bool> is_incoming;
    boost::optional<string> address;
    vector<string> addresses;
    boost::optional<uint32_t> subaddress_index;
    vector<uint32_t> subaddress_indices;
    vector<shared_ptr<monero_destination>> destinations;
    boost::optional<bool> has_destinations;
    boost::optional<shared_ptr<monero_tx_request>> tx_request;

    shared_ptr<monero_transfer_request> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    shared_ptr<monero_transfer_request> copy(const shared_ptr<monero_transfer_request>& src, const shared_ptr<monero_transfer_request>& tgt) const;
    boost::optional<bool> getIsIncoming() const;
    boost::property_tree::ptree to_property_tree() const;
    bool meets_criteria(monero_transfer* transfer) const;
  };

  /**
   * Models a Monero output with wallet extensions.
   */
  struct monero_output_wallet : public monero_output {
    boost::optional<uint32_t> account_index;
    boost::optional<uint32_t> subaddress_index;
    boost::optional<bool> is_spent;
    boost::optional<bool> is_unlocked;
    boost::optional<bool> is_frozen;

    shared_ptr<monero_output_wallet> copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const;
    shared_ptr<monero_output_wallet> copy(const shared_ptr<monero_output_wallet>& src, const shared_ptr<monero_output_wallet>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_output>& self, const shared_ptr<monero_output>& other);
    void merge(const shared_ptr<monero_output_wallet>& self, const shared_ptr<monero_output_wallet>& other);
  };

  /**
   * Configures a request to retrieve wallet outputs (i.e. outputs that the wallet has or had the
   * ability to spend).
   *
   * All outputs are returned except those that do not meet the criteria defined in this request.
   */
  struct monero_output_request : public monero_output_wallet {
    vector<uint32_t> subaddress_indices;
    boost::optional<shared_ptr<monero_tx_request>> tx_request;

    // TODO: necessary to override all super classes?
    shared_ptr<monero_output_request> copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const;
    shared_ptr<monero_output_request> copy(const shared_ptr<monero_output_wallet>& src, const shared_ptr<monero_output_wallet>& tgt) const;
    shared_ptr<monero_output_request> copy(const shared_ptr<monero_output_request>& src, const shared_ptr<monero_output_request>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
    bool meets_criteria(monero_output_wallet* output) const;
  };

  /**
   * Models a Monero transaction in the context of a wallet.
   */
  struct monero_tx_wallet : public monero_tx {
    vector<shared_ptr<monero_incoming_transfer>> incoming_transfers;
    boost::optional<shared_ptr<monero_outgoing_transfer>> outgoing_transfer;
    boost::optional<string> note;

    shared_ptr<monero_tx_wallet> copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const;
    shared_ptr<monero_tx_wallet> copy(const shared_ptr<monero_tx_wallet>& src, const shared_ptr<monero_tx_wallet>& tgt) const;
    bool getIsIncoming() const;
    bool getIsOutgoing() const;
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_tx>& self, const shared_ptr<monero_tx>& other);
    void merge(const shared_ptr<monero_tx_wallet>& self, const shared_ptr<monero_tx_wallet>& other);
  };

  /**
   * Configures a request to retrieve transactions.
   *
   * All transactions are returned except those that do not meet the criteria defined in this request.
   */
  struct monero_tx_request : public monero_tx_wallet {
    boost::optional<bool> is_outgoing;
    boost::optional<bool> is_incoming;
    vector<string> tx_ids;
    boost::optional<bool> has_payment_id;
    vector<string> payment_ids;
    boost::optional<uint64_t> height;
    boost::optional<uint64_t> min_height;
    boost::optional<uint64_t> max_height;
    boost::optional<uint64_t> include_outputs;
    boost::optional<shared_ptr<monero_transfer_request>> transfer_request;
    boost::optional<shared_ptr<monero_output_request>> output_request;

    // TODO: necessary to override all super classes?
    shared_ptr<monero_tx_request> copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const;
    shared_ptr<monero_tx_request> copy(const shared_ptr<monero_tx_wallet>& src, const shared_ptr<monero_tx_wallet>& tgt) const;
    shared_ptr<monero_tx_request> copy(const shared_ptr<monero_tx_request>& src, const shared_ptr<monero_tx_request>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
    bool meets_criteria(monero_tx_wallet* tx) const;
  };

  /**
   * Monero integrated address model.
   */
  struct monero_integrated_address : public serializable_struct {
    string standard_address;
    string payment_id;
    string integrated_address;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Enumerates Monero network types.
   */
  enum monero_send_priority : uint8_t {
    DEFAULT = 0,
    UNIMPORTANT,
    NORMAL,
    ELEVATED
  };

  /**
   * Configures a request to send/sweep funds or create a payment URI.
   */
  struct monero_send_request : public serializable_struct {
    vector<shared_ptr<monero_destination>> destinations;
    boost::optional<string> payment_id;
    boost::optional<monero_send_priority> priority;
    boost::optional<uint32_t> mixin;
    boost::optional<uint32_t> ring_size;
    boost::optional<uint64_t> fee;
    boost::optional<uint32_t> account_index;
    vector<uint32_t> subaddress_indices;
    boost::optional<uint64_t> unlock_time;
    boost::optional<bool> can_split;
    boost::optional<bool> do_not_relay;
    boost::optional<string> note;
    boost::optional<string> recipient_name;
    boost::optional<uint64_t> below_amount;
    boost::optional<bool> sweep_each_subaddress;
    boost::optional<string> key_image;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Models results from importing key images.
   */
  struct monero_key_image_import_result : public serializable_struct {
    boost::optional<uint64_t> height;
    boost::optional<uint64_t> spent_amount;
    boost::optional<uint64_t> unspent_amount;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Base class for results from checking a transaction or reserve proof.
   */
  struct monero_check : public serializable_struct {
    bool is_good;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Results from checking a transaction key.
   */
  struct monero_check_tx : public monero_check {
    boost::optional<bool> in_tx_pool;
    boost::optional<uint64_t> num_confirmations;
    boost::optional<uint64_t> received_amount;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Results from checking a reserve proof.
   */
  struct monero_check_reserve : public monero_check  {
    boost::optional<uint64_t> total_amount;
    boost::optional<uint64_t> unconfirmed_spent_amount;

    boost::property_tree::ptree to_property_tree() const;
  };
}
