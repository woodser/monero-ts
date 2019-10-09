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

#ifndef monero_utils_h
#define monero_utils_h

#include "wallet/monero_wallet_model.h"
#include "cryptonote_basic/cryptonote_basic.h"
#include "serialization/keyvalue_serialization.h"	// TODO: consolidate with other binary deps?
#include "storages/portable_storage.h"

/**
 * Collection of utilities for working with Monero's binary portable storage format.
 */
namespace monero_utils
{
  using namespace std;
  using namespace cryptonote;

  void json_to_binary(const std::string &json, std::string &bin);

  void binary_to_json(const std::string &bin, std::string &json);

  void binary_blocks_to_json(const std::string &bin, std::string &json);

  shared_ptr<monero_tx_query> deserialize_tx_query(const string& txQueryStr);

  shared_ptr<monero_transfer_query> deserialize_transfer_query(const string& transfer_query_str);

  shared_ptr<monero_output_query> deserialize_output_query(const string& output_query_str);

  shared_ptr<monero_send_request> deserialize_send_request(const string& send_request_str);

  vector<shared_ptr<monero_key_image>> deserialize_key_images(const string& key_images_json);

  string serialize(const boost::property_tree::ptree& node);

  void deserialize(const string& json, boost::property_tree::ptree& root);

  /**
   * Convert a Monero Core cryptonote::block to a block in this library's native model.
   *
   * @param cn_block is the Core block to convert
   * @return a block in this library's native model
   */
  shared_ptr<monero_block> cn_block_to_block(const cryptonote::block& cn_block);

  /**
   * Convert a Monero Core crpytonote::transaction to a transaction in this library's
   * native model.
   *
   * @param cn_tx is the Core transaction to convert
   * @param init_as_tx_wallet specifies if a monero_tx xor monero_tx_wallet should be initialized
   */
  shared_ptr<monero_tx> cn_tx_to_tx(const cryptonote::transaction& cn_tx, bool init_as_tx_wallet = false);

  /**
   * Modified from core_rpc_server.cpp to return a string.
   *
   * TODO: remove this duplicate, use core_rpc_server instead
   */
  static std::string get_pruned_tx_json(cryptonote::transaction &tx)
  {
    std::stringstream ss;
    json_archive<true> ar(ss);
    bool r = tx.serialize_base(ar);
    CHECK_AND_ASSERT_MES(r, std::string(), "Failed to serialize rct signatures base");
    return ss.str();
  }

  // ----------------------------- PROPERTY TREE ------------------------------

  // TODO: template implementation here, could move to monero_utils.hpp per https://stackoverflow.com/questions/3040480/c-template-function-compiles-in-header-but-not-implementation
  template <class T> boost::property_tree::ptree to_property_tree(const vector<shared_ptr<T>>& types) {
    boost::property_tree::ptree typeNodes;
    for (const auto& type : types)  {
      typeNodes.push_back(std::make_pair("", type->to_property_tree()));
    }
    return typeNodes;
  }

  // TODO: template implementation here, could move to monero_utils.hpp per https://stackoverflow.com/questions/3040480/c-template-function-compiles-in-header-but-not-implementation
  template <class T> boost::property_tree::ptree to_property_tree(const vector<T>& types) {
    boost::property_tree::ptree typeNodes;
    for (const auto& type : types)  {
      typeNodes.push_back(std::make_pair("", type.to_property_tree()));
    }
    return typeNodes;
  }

  boost::property_tree::ptree to_property_tree(const vector<string>& strs);
  boost::property_tree::ptree to_property_tree(const vector<uint8_t>& nums);
  boost::property_tree::ptree to_property_tree(const vector<uint32_t>& nums);
  boost::property_tree::ptree to_property_tree(const vector<uint64_t>& nums);
}
#endif /* monero_utils_h */
