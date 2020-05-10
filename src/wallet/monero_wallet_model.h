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
  struct monero_sync_result : public serializable_struct {
    uint64_t m_num_blocks_fetched;
    bool m_received_money;
    monero_sync_result() {}
    monero_sync_result(const uint64_t num_blocks_fetched, const bool received_money) : m_num_blocks_fetched(num_blocks_fetched), m_received_money(received_money) {}

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
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
    boost::optional<uint64_t> m_num_unspent_outputs;
    boost::optional<bool> m_is_used;
    boost::optional<uint64_t> m_num_blocks_to_unlock;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
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

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  /**
   * Models an outgoing transfer destination.
   */
  struct monero_destination {
    boost::optional<string> m_address;
    boost::optional<uint64_t> m_amount;

    monero_destination() {}
    monero_destination(const string& address, uint64_t amount) : m_address(address), m_amount(amount) {}
    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static void from_property_tree(const boost::property_tree::ptree& node, const shared_ptr<monero_destination>& destination);
    shared_ptr<monero_destination> copy(const shared_ptr<monero_destination>& src, const shared_ptr<monero_destination>& tgt) const;
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
    boost::optional<uint64_t> m_num_suggested_confirmations;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static void from_property_tree(const boost::property_tree::ptree& node, const shared_ptr<monero_transfer>& transfer);
    virtual boost::optional<bool> is_incoming() const = 0;  // derived class must implement
    shared_ptr<monero_transfer> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    boost::optional<bool> is_outgoing() const {
			if (is_incoming() == boost::none) return boost::none;
      return !(*is_incoming());
    }
    void merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other);
  };

  /**
   * Models an incoming transfer of funds to the wallet.
   */
  struct monero_incoming_transfer : public monero_transfer {
    boost::optional<uint32_t> m_subaddress_index;
    boost::optional<string> m_address;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    shared_ptr<monero_incoming_transfer> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    shared_ptr<monero_incoming_transfer> copy(const shared_ptr<monero_incoming_transfer>& src, const shared_ptr<monero_incoming_transfer>& tgt) const;
    boost::optional<bool> is_incoming() const;
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

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    shared_ptr<monero_outgoing_transfer> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    shared_ptr<monero_outgoing_transfer> copy(const shared_ptr<monero_outgoing_transfer>& src, const shared_ptr<monero_outgoing_transfer>& tgt) const;
    boost::optional<bool> is_incoming() const;
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

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static void from_property_tree(const boost::property_tree::ptree& node, const shared_ptr<monero_transfer_query>& transfer_query);
    static shared_ptr<monero_transfer_query> deserialize_from_block(const string& transfer_query_json);
    shared_ptr<monero_transfer_query> copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const;
    shared_ptr<monero_transfer_query> copy(const shared_ptr<monero_transfer_query>& src, const shared_ptr<monero_transfer_query>& tgt) const;
    boost::optional<bool> is_incoming() const;
    bool meets_criteria(monero_transfer* transfer) const;
  };

  /**
   * Models a Monero output with wallet extensions.
   */
  struct monero_output_wallet : public monero_output {
    boost::optional<uint32_t> m_account_index;
    boost::optional<uint32_t> m_subaddress_index;
    boost::optional<bool> m_is_spent;
    boost::optional<bool> m_is_frozen;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static void from_property_tree(const boost::property_tree::ptree& node, const shared_ptr<monero_output_wallet>& output_wallet);
    shared_ptr<monero_output_wallet> copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const;
    shared_ptr<monero_output_wallet> copy(const shared_ptr<monero_output_wallet>& src, const shared_ptr<monero_output_wallet>& tgt) const;
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
    boost::optional<uint64_t> m_min_amount;
    boost::optional<uint64_t> m_max_amount;
    boost::optional<shared_ptr<monero_tx_query>> m_tx_query;

    //boost::property_tree::ptree to_property_tree() const;
    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static void from_property_tree(const boost::property_tree::ptree& node, const shared_ptr<monero_output_query>& output_query);
    static shared_ptr<monero_output_query> deserialize_from_block(const string& output_query_json);
    bool is_default() const;
    shared_ptr<monero_output_query> copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const;
    shared_ptr<monero_output_query> copy(const shared_ptr<monero_output_wallet>& src, const shared_ptr<monero_output_wallet>& tgt) const; // TODO: necessary to override all super classes?
    shared_ptr<monero_output_query> copy(const shared_ptr<monero_output_query>& src, const shared_ptr<monero_output_query>& tgt) const;
    bool meets_criteria(monero_output_wallet* output) const;

  private:
    static const unique_ptr<monero_output_wallet> M_EMPTY_OUTPUT;
  };

  /**
   * Models a Monero transaction in the context of a wallet.
   */
  struct monero_tx_wallet : public monero_tx {
    boost::optional<shared_ptr<monero_tx_set>> m_tx_set;
    boost::optional<bool> m_is_incoming;
    boost::optional<bool> m_is_outgoing;
    vector<shared_ptr<monero_incoming_transfer>> m_incoming_transfers;
    boost::optional<shared_ptr<monero_outgoing_transfer>> m_outgoing_transfer;
    boost::optional<string> m_note;
    boost::optional<bool> m_is_locked;
    boost::optional<uint64_t> m_input_sum;
    boost::optional<uint64_t> m_output_sum;
    boost::optional<string> m_change_address;
    boost::optional<uint64_t> m_change_amount;
    boost::optional<uint32_t> m_num_dummy_outputs;
    boost::optional<string> m_extra_hex;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static void from_property_tree(const boost::property_tree::ptree& node, const shared_ptr<monero_tx_wallet>& tx_wallet);
    shared_ptr<monero_tx_wallet> copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const;
    shared_ptr<monero_tx_wallet> copy(const shared_ptr<monero_tx_wallet>& src, const shared_ptr<monero_tx_wallet>& tgt) const;
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
    vector<string> m_tx_hashes;
    boost::optional<bool> m_has_payment_id;
    vector<string> m_payment_ids;
    boost::optional<uint64_t> m_height;
    boost::optional<uint64_t> m_min_height;
    boost::optional<uint64_t> m_max_height;
    boost::optional<uint64_t> m_include_outputs;
    boost::optional<shared_ptr<monero_transfer_query>> m_transfer_query;
    boost::optional<shared_ptr<monero_output_query>> m_output_query;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static void from_property_tree(const boost::property_tree::ptree& node, const shared_ptr<monero_tx_query>& tx_query);
    static shared_ptr<monero_tx_query> deserialize_from_block(const string& tx_query_json);
    shared_ptr<monero_tx_query> copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const;
    shared_ptr<monero_tx_query> copy(const shared_ptr<monero_tx_wallet>& src, const shared_ptr<monero_tx_wallet>& tgt) const; // TODO: necessary to override all super classes?
    shared_ptr<monero_tx_query> copy(const shared_ptr<monero_tx_query>& src, const shared_ptr<monero_tx_query>& tgt) const;
    bool meets_criteria(monero_tx_wallet* tx) const;
  };

  /**
   * Groups transactions who share common hex data which is needed in order to
   * sign and submit the transactions.
   *
   * For example, multisig transactions created from send_txs() share a common
   * hex string which is needed in order to sign and submit the multisig
   * transactions.
   */
  struct monero_tx_set : public serializable_struct {
    vector<shared_ptr<monero_tx_wallet>> m_txs;
    boost::optional<string> m_signed_tx_hex;
    boost::optional<string> m_unsigned_tx_hex;
    boost::optional<string> m_multisig_tx_hex;

    //boost::property_tree::ptree to_property_tree() const;
    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static monero_tx_set deserialize(const string& tx_set_json);
  };

  /**
   * Monero integrated address model.
   */
  struct monero_integrated_address : public serializable_struct {
    string m_standard_address;
    string m_payment_id;
    string m_integrated_address;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  /**
   * Enumerates Monero network types.
   */
  enum monero_tx_priority : uint8_t {
    DEFAULT = 0,
    UNIMPORTANT,
    NORMAL,
    ELEVATED
  };

  /**
   * Configures a transaction to send, sweep, or create a payment URI.
   */
  struct monero_tx_config : public serializable_struct {
    vector<shared_ptr<monero_destination>> m_destinations;
    boost::optional<string> m_payment_id;
    boost::optional<monero_tx_priority> m_priority;
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

    monero_tx_config() {}
    monero_tx_config(const monero_tx_config& config);
    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static shared_ptr<monero_tx_config> deserialize(const string& config_json);
    monero_tx_config copy() const;
  };

  /**
   * Models results from importing key images.
   */
  struct monero_key_image_import_result : public serializable_struct {
    boost::optional<uint64_t> m_height;
    boost::optional<uint64_t> m_spent_amount;
    boost::optional<uint64_t> m_unspent_amount;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  /**
   * Base class for results from checking a transaction or reserve proof.
   */
  struct monero_check : public serializable_struct {
    bool m_is_good;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  /**
   * Results from checking a transaction key.
   */
  struct monero_check_tx : public monero_check {
    boost::optional<bool> m_in_tx_pool;
    boost::optional<uint64_t> m_num_confirmations;
    boost::optional<uint64_t> m_received_amount;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  /**
   * Results from checking a reserve proof.
   */
  struct monero_check_reserve : public monero_check  {
    boost::optional<uint64_t> m_total_amount;
    boost::optional<uint64_t> m_unconfirmed_spent_amount;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  /**
   * Models information about a multisig wallet.
   */
  struct monero_multisig_info : serializable_struct {
    bool m_is_multisig;
    bool m_is_ready;
    uint32_t m_threshold;
    uint32_t m_num_participants;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  /**
   * Models the result of initializing a multisig wallet which results in the
   * multisig wallet's address xor another multisig hex to share with
   * participants to create the wallet.
   */
  struct monero_multisig_init_result : serializable_struct {
    boost::optional<string> m_address;
    boost::optional<string> m_multisig_hex;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  /**
   * Models the result of signing multisig tx hex.
   */
  struct monero_multisig_sign_result : serializable_struct {
    boost::optional<string> m_signed_multisig_tx_hex;
    vector<string> m_tx_hashes;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  /**
   * Monero address book entry model.
   */
  struct monero_address_book_entry : serializable_struct {
    boost::optional<uint64_t> m_index;  // TODO: not boost::optional
    boost::optional<string> m_address;
    boost::optional<string> m_description;
    boost::optional<string> m_payment_id;

    monero_address_book_entry() {}
    monero_address_book_entry(uint64_t index, const string& address, const string& description, const string& payment_id) : m_index(index), m_address(address), m_description(description), m_payment_id(payment_id) {}
    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };
}
