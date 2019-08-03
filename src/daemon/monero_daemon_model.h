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

#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

using namespace std;

/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

  /**
   * Base struct which can be serialized.
   */
  struct serializable_struct {

    /**
     * Serializes the struct to a json string.
     *
     * @return the struct serialized to a json string
     */
    string serialize() const;

    /**
     * Convert the struct to a property tree.
     *
     * @return the converted property tree
     */
    virtual boost::property_tree::ptree to_property_tree() const = 0;
  };

  /**
   * Enumerates Monero network types.
   */
  enum MoneroNetworkType : uint8_t {
      MAINNET = 0,
      TESTNET,
      STAGENET
  };

  /**
   * Models a connection to a daemon.
   *
   * TODO: switch to boost::optional<string>
   */
  struct monero_rpc_connection {
    string uri;
    boost::optional<string> username;
    boost::optional<string> password;
    monero_rpc_connection(const string& uri = "", const boost::optional<string>& username = boost::none, const boost::optional<string>& password = boost::none) : uri(uri), username(username), password(password) {}
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
    boost::optional<string> id;
    boost::optional<uint64_t> height;
    boost::optional<uint64_t> timestamp;
    boost::optional<uint64_t> size;
    boost::optional<uint64_t> weight;
    boost::optional<uint64_t> longTermWeight;
    boost::optional<uint64_t> depth;
    boost::optional<uint64_t> difficulty;
    boost::optional<uint64_t> cumulativeDifficulty;
    boost::optional<uint32_t> majorVersion;
    boost::optional<uint32_t> minorVersion;
    boost::optional<uint64_t> nonce;
    boost::optional<string> minerTxId;
    boost::optional<uint32_t> numTxs;
    boost::optional<bool> orphanStatus;
    boost::optional<string> prevId;
    boost::optional<uint64_t> reward;
    boost::optional<string> powHash;

    boost::property_tree::ptree to_property_tree() const;
    virtual void merge(const shared_ptr<monero_block_header>& self, const shared_ptr<monero_block_header>& other);
  };

  /**
   * Models a Monero block in the blockchain.
   */
  struct monero_block : public monero_block_header {
    boost::optional<string> hex;
    boost::optional<shared_ptr<monero_tx>> minerTx;
    vector<shared_ptr<monero_tx>> txs;
    vector<string> txIds;

    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_block_header>& self, const shared_ptr<monero_block_header>& other);
    void merge(const shared_ptr<monero_block>& self, const shared_ptr<monero_block>& other);
  };

  /**
   * Models a Monero transaction on the blockchain.
   */
  struct monero_tx : public serializable_struct {
    static const string DEFAULT_PAYMENT_ID;  // default payment id "0000000000000000"
    boost::optional<shared_ptr<monero_block>> block;
    boost::optional<string> id;
    boost::optional<uint32_t> version;
    boost::optional<bool> isMinerTx;
    boost::optional<string> paymentId;
    boost::optional<uint64_t> fee;
    boost::optional<uint32_t> mixin;
    boost::optional<bool> doNotRelay;
    boost::optional<bool> isRelayed;
    boost::optional<bool> isConfirmed;
    boost::optional<bool> inTxPool;
    boost::optional<uint64_t> numConfirmations;
    boost::optional<uint64_t> unlockTime;
    boost::optional<uint64_t> lastRelayedTimestamp;
    boost::optional<uint64_t> receivedTimestamp;
    boost::optional<bool> isDoubleSpendSeen;
    boost::optional<string> key;
    boost::optional<string> fullHex;
    boost::optional<string> prunedHex;
    boost::optional<string> prunableHex;
    boost::optional<string> prunableHash;
    boost::optional<uint32_t> size;
    boost::optional<uint32_t> weight;
    vector<shared_ptr<monero_output>> vins;
    vector<shared_ptr<monero_output>> vouts;
    vector<uint32_t> outputIndices;
    boost::optional<string> metadata;
    boost::optional<string> commonTxSets;
    vector<uint8_t> extra;
    boost::optional<string> rctSignatures;   // TODO: implement
    boost::optional<string> rctSigPrunable;  // TODO: implement
    boost::optional<bool> isKeptByBlock;
    boost::optional<bool> isFailed;
    boost::optional<uint32_t> lastFailedHeight;
    boost::optional<string> lastFailedId;
    boost::optional<uint32_t> maxUsedBlockHeight;
    boost::optional<string> maxUsedBlockId;
    vector<string> signatures;

    shared_ptr<monero_tx> copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
    virtual void merge(const shared_ptr<monero_tx>& self, const shared_ptr<monero_tx>& other);
    boost::optional<uint64_t> get_height() const;
  };

  /**
   * Models a Monero key image.
   */
  struct monero_key_image : public serializable_struct {
    boost::optional<string> hex;
    boost::optional<string> signature;

    shared_ptr<monero_key_image> copy(const shared_ptr<monero_key_image>& src, const shared_ptr<monero_key_image>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
    void merge(const shared_ptr<monero_key_image>& self, const shared_ptr<monero_key_image>& other);
  };

  /**
   * Models a Monero transaction output.
   */
  struct monero_output : public serializable_struct {
    shared_ptr<monero_tx> tx;
    boost::optional<shared_ptr<monero_key_image>> keyImage;
    boost::optional<uint64_t> amount;
    boost::optional<uint64_t> index;
    vector<uint64_t> ringOutputIndices;
    boost::optional<string> stealthPublicKey;

    shared_ptr<monero_output> copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const;
    boost::property_tree::ptree to_property_tree() const;
    virtual void merge(const shared_ptr<monero_output>& self, const shared_ptr<monero_output>& other);
  };
}
