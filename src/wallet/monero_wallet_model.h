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
    uint64_t m_num_blocks_fetched;
    bool m_received_money;
    monero_sync_result() {}
    monero_sync_result(const uint64_t num_blocks_fetched, const bool received_money) : m_num_blocks_fetched(num_blocks_fetched), m_received_money(received_money) {}
  };

  /**
   * Models a Monero subaddress.
   */
  struct monero_subaddress : public serializable_struct {
    boost::optional<uint32_t> m_account_index;
    boost::optional<uint32_t> m_index;
    boost::optional<string> m_address;
    boost::optional<string> m_label;
    boost::optional<uint64_t> m_balance;
    boost::optional<uint64_t> m_unlocked_balance;
    boost::optional<uint32_t> m_num_unspent_outputs;
    boost::optional<bool> m_is_used;
    boost::optional<uint32_t> m_num_blocks_to_unlock;
//    BEGIN_KV_SERIALIZE_MAP()
//      KV_SERIALIZE(m_account_index)
//      KV_SERIALIZE(index)
//      KV_SERIALIZE(address)
//      KV_SERIALIZE(label)
//      KV_SERIALIZE(balance)
//      KV_SERIALIZE(m_unlocked_balance)
//      KV_SERIALIZE(m_num_unspent_outputs)
//      KV_SERIALIZE(m_is_used)
//      KV_SERIALIZE(m_num_blocks_to_unlock)
//    END_KV_SERIALIZE_MAP()

    boost::property_tree::ptree to_property_tree() const;
    //void merge(const shared_ptr<monero_subaddress>& self, const shared_ptr<monero_subaddress>& other);
  };

  /**
   * Models a Monero account.
   */
  struct monero_account : public serializable_struct {
    boost::optional<uint32_t> m_index;
    boost::optional<string> m_primary_address;
    boost::optional<uint64_t> m_balance;
    boost::optional<uint64_t> m_unlocked_balance;
    boost::optional<string> m_tag;
    vector<monero_subaddress> m_subaddresses;
//    BEGIN_KV_SERIALIZE_MAP()
//      KV_SERIALIZE(index)
//      KV_SERIALIZE(m_primary_address)
//      KV_SERIALIZE(label)
//      KV_SERIALIZE(balance)
//      KV_SERIALIZE(m_unlocked_balance)
//      KV_SERIALIZE(tag)
//      KV_SERIALIZE(subaddresses)
//    END_KV_SERIALIZE_MAP()

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Models an outgoing transfer destination.
   */
  struct monero_destination {
    boost::optional<string> m_address;
    boost::optional<uint64_t> m_amount;

    monero_destination() {}
    monero_destination(const string& address, uint64_t amount) : m_address(address), m_amount(amount) {}
    shared_ptr<monero_destination> copy(const shared_ptr<monero_destination>& src, const shared_ptr<monero_destination>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
  };

  // forward declarations
  struct monero_tx_wallet;
  struct monero_tx_query;
  struct monero_tx_set;

  /**
   * Models a base transfer of funds to or from the wallet.
   */
  struct monero_transfer : serializable_struct {
    shared_ptr<monero_tx_wallet> m_tx;
    boost::optional<uint64_t> m_amount;
    boost::optional<uint32_t> m_account_index;
    boost::optional<uint32_t> m_num_suggested_confirmations;

    virtual boost::optional<bool> is_incoming() const = 0;  // derived class must implement
    shared_ptr<monero_transfer> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    boost::optional<bool> is_outgoing() const {
			if (is_incoming() == boost::none) return boost::none;
      return !(*is_incoming());
    }
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other);
  };

  /**
   * Models an incoming transfer of funds to the wallet.
   */
  struct monero_incoming_transfer : public monero_transfer {
    boost::optional<uint32_t> m_subaddress_index;
    boost::optional<string> m_address;

    shared_ptr<monero_incoming_transfer> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    shared_ptr<monero_incoming_transfer> copy(const shared_ptr<monero_incoming_transfer>& src, const shared_ptr<monero_incoming_transfer>& tgt) const;
    boost::optional<bool> is_incoming() const;
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other);
    void merge(const shared_ptr<monero_incoming_transfer>& self, const shared_ptr<monero_incoming_transfer>& other);
  };

  /**
   * Models an outgoing transfer of funds from the wallet.
   */
  struct monero_outgoing_transfer : public monero_transfer {
    vector<uint32_t> m_subaddress_indices;
    vector<string> m_addresses;
    vector<shared_ptr<monero_destination>> m_destinations;

    shared_ptr<monero_outgoing_transfer> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    shared_ptr<monero_outgoing_transfer> copy(const shared_ptr<monero_outgoing_transfer>& src, const shared_ptr<monero_outgoing_transfer>& tgt) const;
    boost::optional<bool> is_incoming() const;
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other);
    void merge(const shared_ptr<monero_outgoing_transfer>& self, const shared_ptr<monero_outgoing_transfer>& other);
  };

  /**
   * Configures a query to retrieve transfers.
   *
   * All transfers are returned except those that do not meet the criteria defined in this query.
   */
  struct monero_transfer_query : public monero_transfer {
    boost::optional<bool> m_is_incoming;
    boost::optional<string> m_address;
    vector<string> m_addresses;
    boost::optional<uint32_t> m_subaddress_index;
    vector<uint32_t> m_subaddress_indices;
    vector<shared_ptr<monero_destination>> m_destinations;
    boost::optional<bool> m_has_destinations;
    boost::optional<shared_ptr<monero_tx_query>> m_tx_query;

    shared_ptr<monero_transfer_query> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    shared_ptr<monero_transfer_query> copy(const shared_ptr<monero_transfer_query>& src, const shared_ptr<monero_transfer_query>& tgt) const;
    boost::optional<bool> is_incoming() const;
    boost::property_tree::ptree to_property_tree() const;
    bool meets_criteria(monero_transfer* transfer) const;
  };

  /**
   * Models a Monero output with wallet extensions.
   */
  struct monero_output_wallet : public monero_output {
    boost::optional<uint32_t> m_account_index;
    boost::optional<uint32_t> m_subaddress_index;
    boost::optional<bool> m_is_spent;
    boost::optional<bool> m_is_unlocked;
    boost::optional<bool> m_is_frozen;

    shared_ptr<monero_output_wallet> copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const;
    shared_ptr<monero_output_wallet> copy(const shared_ptr<monero_output_wallet>& src, const shared_ptr<monero_output_wallet>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_output>& self, const shared_ptr<monero_output>& other);
    void merge(const shared_ptr<monero_output_wallet>& self, const shared_ptr<monero_output_wallet>& other);
  };

  /**
   * Configures a query to retrieve wallet outputs (i.e. outputs that the wallet has or had the
   * ability to spend).
   *
   * All outputs are returned except those that do not meet the criteria defined in this query.
   */
  struct monero_output_query : public monero_output_wallet {
    vector<uint32_t> m_subaddress_indices;
    boost::optional<shared_ptr<monero_tx_query>> m_tx_query;

    // TODO: necessary to override all super classes?
    bool is_default() const;
    shared_ptr<monero_output_query> copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const;
    shared_ptr<monero_output_query> copy(const shared_ptr<monero_output_wallet>& src, const shared_ptr<monero_output_wallet>& tgt) const;
    shared_ptr<monero_output_query> copy(const shared_ptr<monero_output_query>& src, const shared_ptr<monero_output_query>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
    bool meets_criteria(monero_output_wallet* output) const;

  private:
    static const unique_ptr<monero_output_wallet> M_EMPTY_OUTPUT;
  };

  /**
   * Models a Monero transaction in the context of a wallet.
   */
  struct monero_tx_wallet : public monero_tx {
    boost::optional<shared_ptr<monero_tx_set>> m_tx_set;
    vector<shared_ptr<monero_incoming_transfer>> m_incoming_transfers;
    boost::optional<shared_ptr<monero_outgoing_transfer>> m_outgoing_transfer;
    boost::optional<string> m_note;

    shared_ptr<monero_tx_wallet> copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const;
    shared_ptr<monero_tx_wallet> copy(const shared_ptr<monero_tx_wallet>& src, const shared_ptr<monero_tx_wallet>& tgt) const;
    bool is_incoming() const;
    bool is_outgoing() const;
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_tx>& self, const shared_ptr<monero_tx>& other);
    void merge(const shared_ptr<monero_tx_wallet>& self, const shared_ptr<monero_tx_wallet>& other);
  };

  /**
   * Configures a query to retrieve transactions.
   *
   * All transactions are returned except those that do not meet the criteria defined in this query.
   */
  struct monero_tx_query : public monero_tx_wallet {
    boost::optional<bool> m_is_outgoing;
    boost::optional<bool> m_is_incoming;
    vector<string> m_tx_ids;
    boost::optional<bool> m_has_payment_id;
    vector<string> m_payment_ids;
    boost::optional<uint64_t> m_height;
    boost::optional<uint64_t> m_min_height;
    boost::optional<uint64_t> m_max_height;
    boost::optional<uint64_t> m_include_outputs;
    boost::optional<shared_ptr<monero_transfer_query>> m_transfer_query;
    boost::optional<shared_ptr<monero_output_query>> m_output_query;

    // TODO: necessary to override all super classes?
    shared_ptr<monero_tx_query> copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const;
    shared_ptr<monero_tx_query> copy(const shared_ptr<monero_tx_wallet>& src, const shared_ptr<monero_tx_wallet>& tgt) const;
    shared_ptr<monero_tx_query> copy(const shared_ptr<monero_tx_query>& src, const shared_ptr<monero_tx_query>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
    bool meets_criteria(monero_tx_wallet* tx) const;
  };

  /**
   * Groups transactions who share common hex data which is needed in order to
   * sign and submit the transactions.
   *
   * For example, multisig transactions created from send_split() share a common
   * hex string which is needed in order to sign and submit the multisig
   * transactions.
   */
  struct monero_tx_set : serializable_struct {
    vector<shared_ptr<monero_tx_wallet>> m_txs;
    boost::optional<string> m_signed_tx_hex;
    boost::optional<string> m_unsigned_tx_hex;
    boost::optional<string> m_multisig_tx_hex;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Monero integrated address model.
   */
  struct monero_integrated_address : public serializable_struct {
    string m_standard_address;
    string m_payment_id;
    string m_integrated_address;

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
    vector<shared_ptr<monero_destination>> m_destinations;
    boost::optional<string> m_payment_id;
    boost::optional<monero_send_priority> m_priority;
    boost::optional<uint32_t> m_mixin;
    boost::optional<uint32_t> m_ring_size;
    boost::optional<uint64_t> m_fee;
    boost::optional<uint32_t> m_account_index;
    vector<uint32_t> m_subaddress_indices;
    boost::optional<uint64_t> m_unlock_time;
    boost::optional<bool> m_can_split;
    boost::optional<bool> m_do_not_relay;
    boost::optional<string> m_note;
    boost::optional<string> m_recipient_name;
    boost::optional<uint64_t> m_below_amount;
    boost::optional<bool> m_sweep_each_subaddress;
    boost::optional<string> m_key_image;

    monero_send_request() {}
    monero_send_request(const monero_send_request& request);
    monero_send_request copy() const;
    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Models results from importing key images.
   */
  struct monero_key_image_import_result : public serializable_struct {
    boost::optional<uint64_t> m_height;
    boost::optional<uint64_t> m_spent_amount;
    boost::optional<uint64_t> m_unspent_amount;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Base class for results from checking a transaction or reserve proof.
   */
  struct monero_check : public serializable_struct {
    bool m_is_good;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Results from checking a transaction key.
   */
  struct monero_check_tx : public monero_check {
    boost::optional<bool> m_in_tx_pool;
    boost::optional<uint64_t> m_num_confirmations;
    boost::optional<uint64_t> m_received_amount;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Results from checking a reserve proof.
   */
  struct monero_check_reserve : public monero_check  {
    boost::optional<uint64_t> m_total_amount;
    boost::optional<uint64_t> m_unconfirmed_spent_amount;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Models information about a multisig wallet.
   */
  struct monero_multisig_info : serializable_struct {
    bool m_is_multisig;
    bool m_is_ready;
    uint32_t m_threshold;
    uint32_t m_num_participants;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Models the result of initializing a multisig wallet which results in the
   * multisig wallet's address xor another multisig hex to share with
   * participants to create the wallet.
   */
  struct monero_multisig_init_result : serializable_struct {
    boost::optional<string> m_address;
    boost::optional<string> m_multisig_hex;

    boost::property_tree::ptree to_property_tree() const;
  };

  /**
   * Models the result of signing multisig tx hex.
   */
  struct monero_multisig_sign_result : serializable_struct {
    boost::optional<string> m_signed_multisig_tx_hex;
    vector<string> m_tx_ids;

    boost::property_tree::ptree to_property_tree() const;
  };
}
