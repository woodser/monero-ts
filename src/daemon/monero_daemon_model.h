/**
 * Copyright (c) woodser
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

#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"

/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

  /**
   * Base struct which can be serialized.
   */
  struct serializable_struct {

    /**
     * Serializes the struct to a json std::string.
     *
     * @return the struct serialized to a json std::string
     */
    std::string serialize() const;

    /**
     * Converts the struct to a rapidjson Value.
     *
     * @param allocator is the rapidjson document allocator
     * @return the struct as a rapidjson Value
     */
    virtual rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const = 0;
  };

  /**
   * Enumerates Monero network types.
   */
  enum monero_network_type : uint8_t {
      MAINNET = 0,
      TESTNET,
      STAGENET
  };

  /**
   * Models a Monero version.
   */
  struct monero_version : public serializable_struct {
    boost::optional<uint32_t> m_number;
    boost::optional<bool> m_is_release;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  /**
   * Models a connection to a daemon.
   */
  struct monero_rpc_connection : public serializable_struct {
    boost::optional<std::string> m_uri;
    boost::optional<std::string> m_username;
    boost::optional<std::string> m_password;

    monero_rpc_connection(const boost::optional<std::string>& uri = boost::none, const boost::optional<std::string>& username = boost::none, const boost::optional<std::string>& password = boost::none) : m_uri(uri), m_username(username), m_password(password) {}
    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
  };

  // forward declarations
  struct monero_tx;
  struct monero_output;

  /**
   * Models a Monero block header which contains information about the block.
   *
   * TODO: a header that is transmitted may have fewer fields like cryptonote::block_header; separate?
   */
  struct monero_block_header : public serializable_struct {
    boost::optional<std::string> m_hash;
    boost::optional<uint64_t> m_height;
    boost::optional<uint64_t> m_timestamp;
    boost::optional<uint64_t> m_size;
    boost::optional<uint64_t> m_weight;
    boost::optional<uint64_t> m_long_term_weight;
    boost::optional<uint64_t> m_depth;
    boost::optional<uint64_t> m_difficulty;
    boost::optional<uint64_t> m_cumulative_difficulty;
    boost::optional<uint32_t> m_major_version;
    boost::optional<uint32_t> m_minor_version;
    boost::optional<uint32_t> m_nonce;
    boost::optional<std::string> m_miner_tx_hash;
    boost::optional<uint32_t> m_num_txs;
    boost::optional<bool> m_orphan_status;
    boost::optional<std::string> m_prev_hash;
    boost::optional<uint64_t> m_reward;
    boost::optional<std::string> m_pow_hash;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    virtual void merge(const std::shared_ptr<monero_block_header>& self, const std::shared_ptr<monero_block_header>& other);
  };

  /**
   * Models a Monero block in the blockchain.
   */
  struct monero_block : public monero_block_header {
    boost::optional<std::string> m_hex;
    boost::optional<std::shared_ptr<monero_tx>> m_miner_tx;
    std::vector<std::shared_ptr<monero_tx>> m_txs;
    std::vector<std::string> m_tx_hashes;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    void merge(const std::shared_ptr<monero_block_header>& self, const std::shared_ptr<monero_block_header>& other);
    void merge(const std::shared_ptr<monero_block>& self, const std::shared_ptr<monero_block>& other);
  };

  /**
   * Models a Monero transaction on the blockchain.
   */
  struct monero_tx : public serializable_struct {
    static const std::string DEFAULT_PAYMENT_ID;  // default payment id "0000000000000000"
    boost::optional<std::shared_ptr<monero_block>> m_block;
    boost::optional<std::string> m_hash;
    boost::optional<uint32_t> m_version;
    boost::optional<bool> m_is_miner_tx;
    boost::optional<std::string> m_payment_id;
    boost::optional<uint64_t> m_fee;
    boost::optional<uint32_t> m_ring_size;
    boost::optional<bool> m_relay;
    boost::optional<bool> m_is_relayed;
    boost::optional<bool> m_is_confirmed;
    boost::optional<bool> m_in_tx_pool;
    boost::optional<uint64_t> m_num_confirmations;
    boost::optional<uint64_t> m_unlock_height;
    boost::optional<uint64_t> m_last_relayed_timestamp;
    boost::optional<uint64_t> m_received_timestamp;
    boost::optional<bool> m_is_double_spend_seen;
    boost::optional<std::string> m_key;
    boost::optional<std::string> m_full_hex;
    boost::optional<std::string> m_pruned_hex;
    boost::optional<std::string> m_prunable_hex;
    boost::optional<std::string> m_prunable_hash;
    boost::optional<uint64_t> m_size;
    boost::optional<uint64_t> m_weight;
    std::vector<std::shared_ptr<monero_output>> m_inputs;
    std::vector<std::shared_ptr<monero_output>> m_outputs;
    std::vector<uint32_t> m_output_indices;
    boost::optional<std::string> m_metadata;
    boost::optional<std::string> m_common_tx_sets;
    std::vector<uint8_t> m_extra;
    boost::optional<std::string> m_rct_signatures;   // TODO: implement
    boost::optional<std::string> m_rct_sig_prunable;  // TODO: implement
    boost::optional<bool> m_is_kept_by_block;
    boost::optional<bool> m_is_failed;
    boost::optional<uint64_t> m_last_failed_height;
    boost::optional<std::string> m_last_failed_hash;
    boost::optional<uint64_t> m_max_used_block_height;
    boost::optional<std::string> m_max_used_block_hash;
    std::vector<std::string> m_signatures;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static void from_property_tree(const boost::property_tree::ptree& node, std::shared_ptr<monero_tx> tx);
    std::shared_ptr<monero_tx> copy(const std::shared_ptr<monero_tx>& src, const std::shared_ptr<monero_tx>& tgt) const;
    virtual void merge(const std::shared_ptr<monero_tx>& self, const std::shared_ptr<monero_tx>& other);
    boost::optional<uint64_t> get_height() const;
  };

  /**
   * Models a Monero key image.
   */
  struct monero_key_image : public serializable_struct {
    boost::optional<std::string> m_hex;
    boost::optional<std::string> m_signature;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static void from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_key_image>& key_image);
    static std::vector<std::shared_ptr<monero_key_image>> deserialize_key_images(const std::string& key_images_json);  // TODO: remove this specialty util used once
    std::shared_ptr<monero_key_image> copy(const std::shared_ptr<monero_key_image>& src, const std::shared_ptr<monero_key_image>& tgt) const;
    void merge(const std::shared_ptr<monero_key_image>& self, const std::shared_ptr<monero_key_image>& other);
  };

  /**
   * Models a Monero transaction output.
   */
  struct monero_output : public serializable_struct {
    std::shared_ptr<monero_tx> m_tx;
    boost::optional<std::shared_ptr<monero_key_image>> m_key_image;
    boost::optional<uint64_t> m_amount;
    boost::optional<uint64_t> m_index;
    std::vector<uint64_t> m_ring_output_indices;
    boost::optional<std::string> m_stealth_public_key;

    rapidjson::Value to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const;
    static void from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_output>& output);
    std::shared_ptr<monero_output> copy(const std::shared_ptr<monero_output>& src, const std::shared_ptr<monero_output>& tgt) const;
    virtual void merge(const std::shared_ptr<monero_output>& self, const std::shared_ptr<monero_output>& other);
  };
}
