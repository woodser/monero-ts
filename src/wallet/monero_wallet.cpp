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
#include <chrono>
#include <stdio.h>
#include <iostream>
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"
#include "wallet/wallet_rpc_server_commands_defs.h"

#ifdef WIN32
#include <boost/locale.hpp>
#include <boost/filesystem.hpp>
#endif

using namespace std;
using namespace epee;
using namespace tools;

/**
 * Public library interface.
 */
namespace monero {

  // ------------------------- INITIALIZE CONSTANTS ---------------------------

  static const int DEFAULT_SYNC_INTERVAL_MILLIS = 1000 * 10;   // default refresh interval 10 sec
  static const int DEFAULT_CONNECTION_TIMEOUT_MILLIS = 1000 * 30; // default connection timeout 30 sec

  // ----------------------- INTERNAL PRIVATE HELPERS -----------------------

  bool bool_equals(bool val, const boost::optional<bool>& opt_val) {
    return opt_val == boost::none ? false : val == *opt_val;
  }

  shared_ptr<monero_tx_wallet> build_tx_with_incoming_transfer(const tools::wallet2& w2, uint64_t height, const crypto::hash &payment_id, const tools::wallet2::payment_details &pd) {

    // construct block
    shared_ptr<monero_block> block = make_shared<monero_block>();
    block->height = pd.m_block_height;
    block->timestamp = pd.m_timestamp;

    // construct tx
    shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
    tx->block = block;
    block->txs.push_back(tx);
    tx->id = string_tools::pod_to_hex(pd.m_tx_hash);
    tx->payment_id = string_tools::pod_to_hex(payment_id);
    if (tx->payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->payment_id = tx->payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->payment_id = boost::none;  // clear default payment id
    tx->unlock_time = pd.m_unlock_time;
    tx->fee = pd.m_fee;
    tx->note = w2.get_tx_note(pd.m_tx_hash);
    if (tx->note->empty()) tx->note = boost::none; // clear empty note
    tx->is_miner_tx = pd.m_coinbase ? true : false;
    tx->is_confirmed = true;
    tx->is_failed = false;
    tx->is_relayed = true;
    tx->in_tx_pool = false;
    tx->do_not_relay = false;
    tx->is_double_spend_seen = false;

    // compute num_confirmations TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    // TODO: factor out this duplicate code with build_tx_with_outgoing_transfer()
    if (*block->height >= height || (*block->height == 0 && !*tx->in_tx_pool)) tx->num_confirmations = 0;
    else tx->num_confirmations = height - *block->height;

    // construct transfer
    shared_ptr<monero_incoming_transfer> incoming_transfer = make_shared<monero_incoming_transfer>();
    incoming_transfer->tx = tx;
    tx->incoming_transfers.push_back(incoming_transfer);
    incoming_transfer->amount = pd.m_amount;
    incoming_transfer->account_index = pd.m_subaddr_index.major;
    incoming_transfer->subaddress_index = pd.m_subaddr_index.minor;
    incoming_transfer->address = w2.get_subaddress_as_str(pd.m_subaddr_index);

    // compute num_suggested_confirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 `set_confirmations` but it should be encapsulated in wallet2
    // TODO: factor out this duplicate code with build_tx_with_outgoing_transfer()
    uint64_t block_reward = w2.get_last_block_reward();
    if (block_reward == 0) incoming_transfer->num_suggested_confirmations = 0;
    else incoming_transfer->num_suggested_confirmations = (*incoming_transfer->amount + block_reward - 1) / block_reward;

    // return pointer to new tx
    return tx;
  }

  shared_ptr<monero_tx_wallet> build_tx_with_outgoing_transfer(const tools::wallet2& w2, uint64_t height, const crypto::hash &txid, const tools::wallet2::confirmed_transfer_details &pd) {

    // construct block
    shared_ptr<monero_block> block = make_shared<monero_block>();
    block->height = pd.m_block_height;
    block->timestamp = pd.m_timestamp;

    // construct tx
    shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
    tx->block = block;
    block->txs.push_back(tx);
    tx->id = string_tools::pod_to_hex(txid);
    tx->payment_id = string_tools::pod_to_hex(pd.m_payment_id);
    if (tx->payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->payment_id = tx->payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->payment_id = boost::none;  // clear default payment id
    tx->unlock_time = pd.m_unlock_time;
    tx->fee = pd.m_amount_in - pd.m_amount_out;
    tx->note = w2.get_tx_note(txid);
    if (tx->note->empty()) tx->note = boost::none; // clear empty note
    tx->is_miner_tx = false;
    tx->is_confirmed = true;
    tx->is_failed = false;
    tx->is_relayed = true;
    tx->in_tx_pool = false;
    tx->do_not_relay = false;
    tx->is_double_spend_seen = false;

    // compute num_confirmations TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    if (*block->height >= height || (*block->height == 0 && !*tx->in_tx_pool)) tx->num_confirmations = 0;
    else tx->num_confirmations = height - *block->height;

    // construct transfer
    shared_ptr<monero_outgoing_transfer> outgoing_transfer = make_shared<monero_outgoing_transfer>();
    outgoing_transfer->tx = tx;
    tx->outgoing_transfer = outgoing_transfer;
    uint64_t change = pd.m_change == (uint64_t)-1 ? 0 : pd.m_change; // change may not be known
    outgoing_transfer->amount = pd.m_amount_in - change - *tx->fee;
    outgoing_transfer->account_index = pd.m_subaddr_account;
    vector<uint32_t> subaddress_indices;
    vector<string> addresses;
    for (uint32_t i: pd.m_subaddr_indices) {
      subaddress_indices.push_back(i);
      addresses.push_back(w2.get_subaddress_as_str({pd.m_subaddr_account, i}));
    }
    outgoing_transfer->subaddress_indices = subaddress_indices;
    outgoing_transfer->addresses = addresses;

    // initialize destinations
    for (const auto &d: pd.m_dests) {
      shared_ptr<monero_destination> destination = make_shared<monero_destination>();
      destination->amount = d.amount;
      destination->address = d.original.empty() ? cryptonote::get_account_address_as_str(w2.nettype(), d.is_subaddress, d.addr) : d.original;
      outgoing_transfer->destinations.push_back(destination);
    }

    // replace transfer amount with destination sum
    // TODO monero core: confirmed tx from/to same account has amount 0 but cached transfer destinations
    if (*outgoing_transfer->amount == 0 && !outgoing_transfer->destinations.empty()) {
      uint64_t amount = 0;
      for (const shared_ptr<monero_destination>& destination : outgoing_transfer->destinations) amount += *destination->amount;
      outgoing_transfer->amount = amount;
    }

    // compute num_suggested_confirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    uint64_t block_reward = w2.get_last_block_reward();
    if (block_reward == 0) outgoing_transfer->num_suggested_confirmations = 0;
    else outgoing_transfer->num_suggested_confirmations = (*outgoing_transfer->amount + block_reward - 1) / block_reward;

    // return pointer to new tx
    return tx;
  }

  shared_ptr<monero_tx_wallet> build_tx_with_incoming_transfer_unconfirmed(const tools::wallet2& w2, const crypto::hash &payment_id, const tools::wallet2::pool_payment_details &ppd) {

    // construct tx
    const tools::wallet2::payment_details &pd = ppd.m_pd;
    shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
    tx->id = string_tools::pod_to_hex(pd.m_tx_hash);
    tx->payment_id = string_tools::pod_to_hex(payment_id);
    if (tx->payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->payment_id = tx->payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->payment_id = boost::none;  // clear default payment id
    tx->unlock_time = pd.m_unlock_time;
    tx->fee = pd.m_fee;
    tx->note = w2.get_tx_note(pd.m_tx_hash);
    if (tx->note->empty()) tx->note = boost::none; // clear empty note
    tx->is_miner_tx = false;
    tx->is_confirmed = false;
    tx->is_failed = false;
    tx->is_relayed = true;
    tx->in_tx_pool = true;
    tx->do_not_relay = false;
    tx->is_double_spend_seen = ppd.m_double_spend_seen;
    tx->num_confirmations = 0;

    // construct transfer
    shared_ptr<monero_incoming_transfer> incoming_transfer = make_shared<monero_incoming_transfer>();
    incoming_transfer->tx = tx;
    tx->incoming_transfers.push_back(incoming_transfer);
    incoming_transfer->amount = pd.m_amount;
    incoming_transfer->account_index = pd.m_subaddr_index.major;
    incoming_transfer->subaddress_index = pd.m_subaddr_index.minor;
    incoming_transfer->address = w2.get_subaddress_as_str(pd.m_subaddr_index);

    // compute num_suggested_confirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    uint64_t block_reward = w2.get_last_block_reward();
    if (block_reward == 0) incoming_transfer->num_suggested_confirmations = 0;
    else incoming_transfer->num_suggested_confirmations = (*incoming_transfer->amount + block_reward - 1) / block_reward;

    // return pointer to new tx
    return tx;
  }

  shared_ptr<monero_tx_wallet> build_tx_with_outgoing_transfer_unconfirmed(const tools::wallet2& w2, const crypto::hash &txid, const tools::wallet2::unconfirmed_transfer_details &pd) {

    // construct tx
    shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
    tx->is_failed = pd.m_state == tools::wallet2::unconfirmed_transfer_details::failed;
    tx->id = string_tools::pod_to_hex(txid);
    tx->payment_id = string_tools::pod_to_hex(pd.m_payment_id);
    if (tx->payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->payment_id = tx->payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->payment_id = boost::none;  // clear default payment id
    tx->unlock_time = pd.m_tx.unlock_time;
    tx->fee = pd.m_amount_in - pd.m_amount_out;
    tx->note = w2.get_tx_note(txid);
    if (tx->note->empty()) tx->note = boost::none; // clear empty note
    tx->is_miner_tx = false;
    tx->is_confirmed = false;
    tx->is_relayed = !tx->is_failed.get();
    tx->in_tx_pool = !tx->is_failed.get();
    tx->do_not_relay = false;
    if (!tx->is_failed.get() && tx->is_relayed.get()) tx->is_double_spend_seen = false;  // TODO: test and handle if true
    tx->num_confirmations = 0;

    // construct transfer
    shared_ptr<monero_outgoing_transfer> outgoing_transfer = make_shared<monero_outgoing_transfer>();
    outgoing_transfer->tx = tx;
    tx->outgoing_transfer = outgoing_transfer;
    outgoing_transfer->amount = pd.m_amount_in - pd.m_change - tx->fee.get();
    outgoing_transfer->account_index = pd.m_subaddr_account;
    vector<uint32_t> subaddress_indices;
    vector<string> addresses;
    for (uint32_t i: pd.m_subaddr_indices) {
      subaddress_indices.push_back(i);
      addresses.push_back(w2.get_subaddress_as_str({pd.m_subaddr_account, i}));
    }
    outgoing_transfer->subaddress_indices = subaddress_indices;
    outgoing_transfer->addresses = addresses;

    // initialize destinations
    for (const auto &d: pd.m_dests) {
      shared_ptr<monero_destination> destination = make_shared<monero_destination>();
      destination->amount = d.amount;
      destination->address = d.original.empty() ? cryptonote::get_account_address_as_str(w2.nettype(), d.is_subaddress, d.addr) : d.original;
      outgoing_transfer->destinations.push_back(destination);
    }

    // replace transfer amount with destination sum
    // TODO monero core: confirmed tx from/to same account has amount 0 but cached transfer destinations
    if (*outgoing_transfer->amount == 0 && !outgoing_transfer->destinations.empty()) {
      uint64_t amount = 0;
      for (const shared_ptr<monero_destination>& destination : outgoing_transfer->destinations) amount += *destination->amount;
      outgoing_transfer->amount = amount;
    }

    // compute num_suggested_confirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    uint64_t block_reward = w2.get_last_block_reward();
    if (block_reward == 0) outgoing_transfer->num_suggested_confirmations = 0;
    else outgoing_transfer->num_suggested_confirmations = (*outgoing_transfer->amount + block_reward - 1) / block_reward;

    // return pointer to new tx
    return tx;
  }

  shared_ptr<monero_tx_wallet> build_tx_with_vout(const tools::wallet2& w2, const tools::wallet2::transfer_details& td) {

    // construct block
    shared_ptr<monero_block> block = make_shared<monero_block>();
    block->height = td.m_block_height;

    // construct tx
    shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
    tx->block = block;
    block->txs.push_back(tx);
    tx->id = epee::string_tools::pod_to_hex(td.m_txid);
    tx->is_confirmed = true;
    tx->is_failed = false;
    tx->is_relayed = true;
    tx->in_tx_pool = false;
    tx->do_not_relay = false;
    tx->is_double_spend_seen = false;

    // construct vout
    shared_ptr<monero_output_wallet> vout = make_shared<monero_output_wallet>();
    vout->tx = tx;
    tx->vouts.push_back(vout);
    vout->amount = td.amount();
    vout->index = td.m_global_output_index;
    vout->account_index = td.m_subaddr_index.major;
    vout->subaddress_index = td.m_subaddr_index.minor;
    vout->is_spent = td.m_spent;
    vout->is_unlocked = w2.is_transfer_unlocked(td);
    vout->is_frozen = td.m_frozen;
    if (td.m_key_image_known) {
      vout->key_image = make_shared<monero_key_image>();
      vout->key_image.get()->hex = epee::string_tools::pod_to_hex(td.m_key_image);
    }

    // return pointer to new tx
    return tx;
  }

  /**
   * Merges a transaction into a unique set of transactions.
   *
   * TODO monero-core: skip_if_absent only necessary because incoming payments not returned
   * when sent from/to same account #4500
   *
   * @param tx is the transaction to merge into the existing txs
   * @param tx_map maps tx ids to txs
   * @param block_map maps block heights to blocks
   * @param skip_if_absent specifies if the tx should not be added if it doesn't already exist
   */
  void merge_tx(const shared_ptr<monero_tx_wallet>& tx, map<string, shared_ptr<monero_tx_wallet>>& tx_map, map<uint64_t, shared_ptr<monero_block>>& block_map, bool skip_if_absent) {
    if (tx->id == boost::none) throw runtime_error("Tx id is not initialized");

    // if tx doesn't exist, add it (unless skipped)
    map<string, shared_ptr<monero_tx_wallet>>::const_iterator tx_iter = tx_map.find(*tx->id);
    if (tx_iter == tx_map.end()) {
      if (!skip_if_absent) {
        tx_map[*tx->id] = tx;
      } else {
        MWARNING("WARNING: tx does not already exist");
      }
    }

    // otherwise merge with existing tx
    else {
      shared_ptr<monero_tx_wallet>& a_tx = tx_map[*tx->id];
      a_tx->merge(a_tx, tx);
    }

    // if confirmed, merge tx's block
    if (tx->get_height() != boost::none) {
      map<uint64_t, shared_ptr<monero_block>>::const_iterator blockIter = block_map.find(tx->get_height().get());
      if (blockIter == block_map.end()) {
        block_map[tx->get_height().get()] = tx->block.get();
      } else {
        shared_ptr<monero_block>& a_block = block_map[tx->get_height().get()];
        a_block->merge(a_block, tx->block.get());
      }
    }
  }

  /**
   * Returns true iff tx1's height is known to be less than tx2's height for sorting.
   */
  bool tx_height_less_than(const shared_ptr<monero_tx>& tx1, const shared_ptr<monero_tx>& tx2) {
    if (tx1->block != boost::none && tx2->block != boost::none) return tx1->get_height() < tx2->get_height();
    else if (tx1->block == boost::none) return false;
    else return true;
  }

  /**
   * Returns true iff transfer1 is ordered before transfer2 by ascending account and subaddress indices.
   */
  bool incoming_transfer_before(const shared_ptr<monero_incoming_transfer>& transfer1, const shared_ptr<monero_incoming_transfer>& transfer2) {

    // compare by height
    if (tx_height_less_than(transfer1->tx, transfer2->tx)) return true;

    // compare by account and subaddress index
    if (transfer1->account_index.get() < transfer2->account_index.get()) return true;
    else if (transfer1->account_index.get() == transfer2->account_index.get()) return transfer1->subaddress_index.get() < transfer2->subaddress_index.get();
    else return false;
  }

  /**
   * Returns true iff wallet vout1 is ordered before vout2 by ascending account and subaddress indices then index.
   */
  bool vout_before(const shared_ptr<monero_output>& o1, const shared_ptr<monero_output>& o2) {
    shared_ptr<monero_output_wallet> ow1 = static_pointer_cast<monero_output_wallet>(o1);
    shared_ptr<monero_output_wallet> ow2 = static_pointer_cast<monero_output_wallet>(o2);

    // compare by height
    if (tx_height_less_than(ow1->tx, ow2->tx)) return true;

    // compare by account index, subaddress index, and output
    if (ow1->account_index.get() < ow2->account_index.get()) return true;
    else if (ow1->account_index.get() == ow2->account_index.get()) {
      if (ow1->subaddress_index.get() < ow2->subaddress_index.get()) return true;
      if (ow1->subaddress_index.get() == ow2->subaddress_index.get() && ow1->index.get() < ow2->index.get()) return true;
    }
    return false;
  }

  /**
   * ---------------- DUPLICATED WALLET RPC TRANSFER CODE ---------------------
   *
   * These functions are duplicated from private functions in wallet rpc
   * on_transfer/on_transfer_split, with minor modifications to not be class members.
   *
   * This code is used to generate and send transactions with equivalent functionality as
   * wallet rpc.
   *
   * Duplicated code is not ideal.  Solutions considered:
   *
   * (1) Duplicate wallet rpc code as done here.
   * (2) Modify monero-wallet-rpc on_transfer() / on_transfer_split() to be public.
   * (3) Modify monero-wallet-rpc to make this class a friend.
   * (4) Move all logic in monero-wallet-rpc to wallet2 so all users can access.
   *
   * Options 2-4 require modification of Monero Core C++.  Of those, (4) is probably ideal.
   * TODO: open patch on Monero core which moves common wallet rpc logic (e.g. on_transfer, on_transfer_split) to w2.
   *
   * Until then, option (1) is used because it allows Monero Core binaries to be used without modification, it's easy, and
   * anything other than (4) is temporary.
   */
  //------------------------------------------------------------------------------------------------------------------------------
  bool validate_transfer(wallet2* w2, const std::list<wallet_rpc::transfer_destination>& destinations, const std::string& payment_id, std::vector<cryptonote::tx_destination_entry>& dsts, std::vector<uint8_t>& extra, bool at_least_one_destination, epee::json_rpc::error& er)
  {
    crypto::hash8 integrated_payment_id = crypto::null_hash8;
    std::string extra_nonce;
    for (auto it = destinations.begin(); it != destinations.end(); it++)
    {
      cryptonote::address_parse_info info;
      cryptonote::tx_destination_entry de;
      er.message = "";
      if(!get_account_address_from_str_or_url(info, w2->nettype(), it->address,
        [&er](const std::string &url, const std::vector<std::string> &addresses, bool dnssec_valid)->std::string {
          if (!dnssec_valid)
          {
            er.message = std::string("Invalid DNSSEC for ") + url;
            return {};
          }
          if (addresses.empty())
          {
            er.message = std::string("No Monero address found at ") + url;
            return {};
          }
          return addresses[0];
        }))
      {
        er.code = WALLET_RPC_ERROR_CODE_WRONG_ADDRESS;
        if (er.message.empty())
          er.message = std::string("WALLET_RPC_ERROR_CODE_WRONG_ADDRESS: ") + it->address;
        return false;
      }

      de.original = it->address;
      de.addr = info.address;
      de.is_subaddress = info.is_subaddress;
      de.amount = it->amount;
      de.is_integrated = info.has_payment_id;
      dsts.push_back(de);

      if (info.has_payment_id)
      {
        if (!payment_id.empty() || integrated_payment_id != crypto::null_hash8)
        {
          er.code = WALLET_RPC_ERROR_CODE_WRONG_PAYMENT_ID;
          er.message = "A single payment id is allowed per transaction";
          return false;
        }
        integrated_payment_id = info.payment_id;
        cryptonote::set_encrypted_payment_id_to_tx_extra_nonce(extra_nonce, integrated_payment_id);

        /* Append Payment ID data into extra */
        if (!cryptonote::add_extra_nonce_to_tx_extra(extra, extra_nonce)) {
          er.code = WALLET_RPC_ERROR_CODE_WRONG_PAYMENT_ID;
          er.message = "Something went wrong with integrated payment_id.";
          return false;
        }
      }
    }

    if (at_least_one_destination && dsts.empty())
    {
      er.code = WALLET_RPC_ERROR_CODE_ZERO_DESTINATION;
      er.message = "No destinations for this transfer";
      return false;
    }

    if (!payment_id.empty())
    {

      /* Just to clarify */
      const std::string& payment_id_str = payment_id;

      crypto::hash long_payment_id;
      crypto::hash8 short_payment_id;

      /* Parse payment ID */
      if (wallet2::parse_long_payment_id(payment_id_str, long_payment_id)) {
        cryptonote::set_payment_id_to_tx_extra_nonce(extra_nonce, long_payment_id);
      }
      else {
        er.code = WALLET_RPC_ERROR_CODE_WRONG_PAYMENT_ID;
        er.message = "Payment id has invalid format: \"" + payment_id_str + "\", expected 64 character string";
        return false;
      }

      /* Append Payment ID data into extra */
      if (!cryptonote::add_extra_nonce_to_tx_extra(extra, extra_nonce)) {
        er.code = WALLET_RPC_ERROR_CODE_WRONG_PAYMENT_ID;
        er.message = "Something went wrong with payment_id. Please check its format: \"" + payment_id_str + "\", expected 64-character string";
        return false;
      }

    }
    return true;
  }
  //------------------------------------------------------------------------------------------------------------------------------
  static std::string ptx_to_string(const tools::wallet2::pending_tx &ptx)
  {
    std::ostringstream oss;
    boost::archive::portable_binary_oarchive ar(oss);
    try
    {
      ar << ptx;
    }
    catch (...)
    {
      return "";
    }
    return epee::string_tools::buff_to_hex_nodelimer(oss.str());
  }
  //------------------------------------------------------------------------------------------------------------------------------
  template<typename T> static bool is_error_value(const T &val) { return false; }
  static bool is_error_value(const std::string &s) { return s.empty(); }
  //------------------------------------------------------------------------------------------------------------------------------
  template<typename T, typename V>
  static bool fill(T &where, V s)
  {
    if (is_error_value(s)) return false;
    where = std::move(s);
    return true;
  }
  //------------------------------------------------------------------------------------------------------------------------------
  template<typename T, typename V>
  static bool fill(std::list<T> &where, V s)
  {
    if (is_error_value(s)) return false;
    where.emplace_back(std::move(s));
    return true;
  }
  //------------------------------------------------------------------------------------------------------------------------------
  static uint64_t total_amount(const tools::wallet2::pending_tx &ptx)
  {
    uint64_t amount = 0;
    for (const auto &dest: ptx.dests) amount += dest.amount;
    return amount;
  }
  //------------------------------------------------------------------------------------------------------------------------------
  template<typename Ts, typename Tu>
  bool fill_response(wallet2* w2, std::vector<tools::wallet2::pending_tx> &ptx_vector,
      bool get_tx_key, Ts& tx_key, Tu &amount, Tu &fee, std::string &multisig_txset, std::string &unsigned_txset, bool do_not_relay,
      Ts &tx_hash, bool get_tx_hex, Ts &tx_blob, bool get_tx_metadata, Ts &tx_metadata, epee::json_rpc::error &er)
  {
    for (const auto & ptx : ptx_vector)
    {
      if (get_tx_key)
      {
        epee::wipeable_string s = epee::to_hex::wipeable_string(ptx.tx_key);
        for (const crypto::secret_key& additional_tx_key : ptx.additional_tx_keys)
          s += epee::to_hex::wipeable_string(additional_tx_key);
        fill(tx_key, std::string(s.data(), s.size()));
      }
      // Compute amount leaving wallet in tx. By convention dests does not include change outputs
      fill(amount, total_amount(ptx));
      fill(fee, ptx.fee);
    }

    if (w2->multisig())
    {
      multisig_txset = epee::string_tools::buff_to_hex_nodelimer(w2->save_multisig_tx(ptx_vector));
      if (multisig_txset.empty())
      {
        er.code = WALLET_RPC_ERROR_CODE_UNKNOWN_ERROR;
        er.message = "Failed to save multisig tx set after creation";
        return false;
      }
    }
    else
    {
      if (w2->watch_only()){
        unsigned_txset = epee::string_tools::buff_to_hex_nodelimer(w2->dump_tx_to_str(ptx_vector));
        if (unsigned_txset.empty())
        {
          er.code = WALLET_RPC_ERROR_CODE_UNKNOWN_ERROR;
          er.message = "Failed to save unsigned tx set after creation";
          return false;
        }
      }
      else if (!do_not_relay)
        w2->commit_tx(ptx_vector);

      // populate response with tx hashes
      for (auto & ptx : ptx_vector)
      {
        bool r = fill(tx_hash, epee::string_tools::pod_to_hex(cryptonote::get_transaction_hash(ptx.tx)));
        r = r && (!get_tx_hex || fill(tx_blob, epee::string_tools::buff_to_hex_nodelimer(tx_to_blob(ptx.tx))));
        r = r && (!get_tx_metadata || fill(tx_metadata, ptx_to_string(ptx)));
        if (!r)
        {
          er.code = WALLET_RPC_ERROR_CODE_UNKNOWN_ERROR;
          er.message = "Failed to save tx info";
          return false;
        }
      }
    }
    return true;
  }

  // ----------------------------- WALLET LISTENER ----------------------------

  /**
   * Listens to wallet2 notifications in order to facilitate external wallet notifications.
   */
  struct wallet2_listener : public tools::i_wallet2_callback {

  public:

    /**
     * Constructs the listener.
     *
     * @param wallet provides context to inform external notifications
     * @param wallet2 provides source notifications which this listener propagates to external listeners
     */
    wallet2_listener(monero_wallet& wallet, tools::wallet2& w2) : wallet(wallet), w2(w2) {
      this->listener = boost::none;
      this->sync_start_height = boost::none;
      this->sync_end_height = boost::none;
      this->sync_listener = boost::none;
    }

    ~wallet2_listener() {
      MTRACE("~wallet2_listener()");
    }

    void set_wallet_listener(boost::optional<monero_wallet_listener&> listener) {
      this->listener = listener;
      update_listening();
    }

    void on_sync_start(uint64_t start_height, boost::optional<monero_sync_listener&> sync_listener) {
      if (sync_start_height != boost::none || sync_end_height != boost::none) throw runtime_error("Sync start or end height should not already be allocated, is previous sync in progress?");
      sync_start_height = start_height;
      sync_end_height = wallet.get_chain_height();
      this->sync_listener = sync_listener;
      update_listening();
    }

    void on_sync_end() {
      sync_start_height = boost::none;
      sync_end_height = boost::none;
      sync_listener = boost::none;
      update_listening();
    }

    virtual void on_new_block(uint64_t height, const cryptonote::block& cn_block) {

      // notify listener of block
      if (listener != boost::none) listener->on_new_block(height);

      // notify listeners of sync progress
      if (sync_start_height != boost::none && height >= *sync_start_height) {
        if (height >= *sync_end_height) sync_end_height = height + 1;	// increase end height if necessary
        double percent_done = (double) (height - *sync_start_height + 1) / (double) (*sync_end_height - *sync_start_height);
        string message = string("Synchronizing");
        if (listener != boost::none) listener.get().on_sync_progress(height, *sync_start_height, *sync_end_height, percent_done, message);
        if (sync_listener != boost::none) sync_listener.get().on_sync_progress(height, *sync_start_height, *sync_end_height, percent_done, message);
      }
    }

    virtual void on_money_received(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& cn_tx, uint64_t amount, const cryptonote::subaddress_index& subaddr_index, uint64_t unlock_time) {
      MTRACE("wallet2_listener::on_money_received()");
      if (listener == boost::none) return;

      // create native library tx
      shared_ptr<monero_block> block = make_shared<monero_block>();
      block->height = height;
      shared_ptr<monero_tx_wallet> tx = static_pointer_cast<monero_tx_wallet>(monero_utils::cn_tx_to_tx(cn_tx, true));
      block->txs.push_back(tx);
      tx->block = block;
      tx->id = epee::string_tools::pod_to_hex(txid);
      tx->unlock_time = unlock_time;
      shared_ptr<monero_output_wallet> output = make_shared<monero_output_wallet>();
      tx->vouts.push_back(output);
      output->tx = tx;
      output->amount = amount;
      output->account_index = subaddr_index.major;
      output->subaddress_index = subaddr_index.minor;

      // notify listener of output
      listener->on_output_received(*output);
    }

    virtual void on_money_spent(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& cn_tx_in, uint64_t amount, const cryptonote::transaction& cn_tx_out, const cryptonote::subaddress_index& subaddr_index) {
      MTRACE("wallet2_listener::on_money_spent()");
      if (&cn_tx_in != &cn_tx_out) throw runtime_error("on_money_spent() in tx is different than out tx");

      // create native library tx
      shared_ptr<monero_block> block = make_shared<monero_block>();
      block->height = height;
      shared_ptr<monero_tx_wallet> tx = static_pointer_cast<monero_tx_wallet>(monero_utils::cn_tx_to_tx(cn_tx_in, true));
      block->txs.push_back(tx);
      tx->block = block;
      tx->id = epee::string_tools::pod_to_hex(txid);
      shared_ptr<monero_output_wallet> output = make_shared<monero_output_wallet>();
      tx->vins.push_back(output);
      output->tx = tx;
      output->amount = amount;
      output->account_index = subaddr_index.major;
      output->subaddress_index = subaddr_index.minor;

      // notify listener of output
      listener->on_output_spent(*output);

      // TODO **: to notify or not to notify?
//        std::string tx_hash = epee::string_tools::pod_to_hex(txid);
//        LOG_PRINT_L3(__FUNCTION__ << ": money spent. height:  " << height
//                     << ", tx: " << tx_hash
//                     << ", amount: " << print_money(amount)
//                     << ", idx: " << subaddr_index);
//        // do not signal on sent tx if wallet is not syncronized completely
//        if (m_listener && m_wallet->synchronized()) {
//            m_listener->moneySpent(tx_hash, amount);
//            m_listener->updated();
//        }
    }

  private:
    monero_wallet& wallet;  // wallet to provide context for notifications
    tools::wallet2& w2;     // internal wallet implementation to listen to
    boost::optional<monero_wallet_listener&> listener; // target listener to invoke with notifications
    boost::optional<monero_sync_listener&> sync_listener;
    boost::optional<uint64_t> sync_start_height;
    boost::optional<uint64_t> sync_end_height;

    void update_listening() {
      w2.callback(listener == boost::none && sync_listener == boost::none ? nullptr : this);
    }
  };

  // ---------------------------- WALLET MANAGEMENT ---------------------------

  bool monero_wallet::wallet_exists(const string& path) {
    MTRACE("wallet_exists(" << path << ")");
    bool key_file_exists;
    bool wallet_file_exists;
    tools::wallet2::wallet_exists(path, key_file_exists, wallet_file_exists);
    return wallet_file_exists;
  }

  monero_wallet* monero_wallet::open_wallet(const string& path, const string& password, const monero_network_type network_type) {
    MTRACE("open_wallet(" << path << ", " << password << ", " << network_type << ")");
    monero_wallet* wallet = new monero_wallet();
    wallet->w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    wallet->w2->load(path, password);
    wallet->w2->init("");
    wallet->init_common();
    return wallet;
  }

  monero_wallet* monero_wallet::create_wallet_random(const string& path, const string& password) {
    MTRACE("create_wallet_random(path, password)");
    throw runtime_error("Not implemented");
  }

  monero_wallet* monero_wallet::create_wallet_random(const string& path, const string& password, const monero_network_type network_type, const monero_rpc_connection& daemon_connection, const string& language) {
    MTRACE("create_wallet_random(path, password, network_type, daemon_connection, language)");
    monero_wallet* wallet = new monero_wallet();
    wallet->w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    wallet->set_daemon_connection(daemon_connection);
    wallet->w2->set_seed_language(language);
    crypto::secret_key secret_key;
    wallet->w2->generate(path, password, secret_key, false, false);
    wallet->init_common();
    return wallet;
  }

  monero_wallet* monero_wallet::create_wallet_from_mnemonic(const string& path, const string& password, const monero_network_type network_type, const string& mnemonic) {
    MTRACE("create_wallet_from_mnemonic(path, password, network_type, mnemonic)");
    throw runtime_error("Not implemented");
  }

  monero_wallet* monero_wallet::create_wallet_from_mnemonic(const string& path, const string& password, const monero_network_type network_type, const string& mnemonic, const monero_rpc_connection& daemon_connection, uint64_t restore_height) {
    MTRACE("create_wallet_from_mnemonic(path, password, mnemonic, network_type, daemon_connection, restore_height)");
    monero_wallet* wallet = new monero_wallet();

    // validate mnemonic and get recovery key and language
    crypto::secret_key recoveryKey;
    std::string language;
    bool is_valid = crypto::ElectrumWords::words_to_bytes(mnemonic, recoveryKey, language);
    if (!is_valid) throw runtime_error("Invalid mnemonic");
    if (language == crypto::ElectrumWords::old_language_name) language = Language::English().get_language_name();

    // initialize wallet
    wallet->w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    wallet->set_daemon_connection(daemon_connection);
    wallet->w2->set_seed_language(language);
    wallet->w2->generate(path, password, recoveryKey, true, false);
    wallet->w2->set_refresh_from_block_height(restore_height);
    wallet->init_common();
    return wallet;
  }

  monero_wallet* monero_wallet::create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key) {
    MTRACE("create_wallet_from_keys(path, password, address, view_key, spend_key, network_type)");
    throw runtime_error("Not implemented");
  }

  monero_wallet* monero_wallet::create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key, const monero_rpc_connection& daemon_connection, uint64_t restore_height) {
    MTRACE("create_wallet_from_keys(path, password, address, view_key, spend_key, network_type, daemon_connection, restore_height)");
    throw runtime_error("Not implemented");
  }

  monero_wallet* monero_wallet::create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key, const monero_rpc_connection& daemon_connection, uint64_t restore_height, const string& language) {
    MTRACE("create_wallet_from_keys(path, password, address, view_key, spend_key, network_type, daemon_connection, restore_height, language)");
    monero_wallet* wallet = new monero_wallet();

    // validate and parse address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, static_cast<cryptonote::network_type>(network_type), address)) throw runtime_error("failed to parse address");

    // validate and parse optional private spend key
    crypto::secret_key spend_key_sk;
    bool has_spend_key = false;
    if (!spend_key.empty()) {
      cryptonote::blobdata spend_key_data;
      if (!epee::string_tools::parse_hexstr_to_binbuff(spend_key, spend_key_data) || spend_key_data.size() != sizeof(crypto::secret_key)) {
        throw runtime_error("failed to parse secret spend key");
      }
      has_spend_key = true;
      spend_key_sk = *reinterpret_cast<const crypto::secret_key*>(spend_key_data.data());
    }

    // validate and parse private view key
    bool has_view_key = true;
    crypto::secret_key view_key_sk;
    if (!view_key.empty()) {
      if (has_spend_key) has_view_key = false;
      else throw runtime_error("Neither view key nor spend key supplied, cancelled");
    }
    if (has_view_key) {
      cryptonote::blobdata view_key_data;
      if (!epee::string_tools::parse_hexstr_to_binbuff(view_key, view_key_data) || view_key_data.size() != sizeof(crypto::secret_key)) {
        throw runtime_error("failed to parse secret view key");
      }
      view_key_sk = *reinterpret_cast<const crypto::secret_key*>(view_key_data.data());
    }

    // check the spend and view keys match the given address
    crypto::public_key pkey;
    if (has_spend_key) {
      if (!crypto::secret_key_to_public_key(spend_key_sk, pkey)) throw runtime_error("failed to verify secret spend key");
      if (info.address.m_spend_public_key != pkey) throw runtime_error("spend key does not match address");
    }
    if (has_view_key) {
      if (!crypto::secret_key_to_public_key(view_key_sk, pkey)) throw runtime_error("failed to verify secret view key");
      if (info.address.m_view_public_key != pkey) throw runtime_error("view key does not match address");
    }

    // initialize wallet
    wallet->w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    if (has_spend_key && has_view_key) wallet->w2->generate(path, password, info.address, spend_key_sk, view_key_sk);
    if (!has_spend_key && has_view_key) wallet->w2->generate(path, password, info.address, view_key_sk);
    if (has_spend_key && !has_view_key) wallet->w2->generate(path, password, spend_key_sk, true, false);
    wallet->set_daemon_connection(daemon_connection);
    wallet->w2->set_refresh_from_block_height(restore_height);
    wallet->w2->set_seed_language(language);
    wallet->init_common();
    return wallet;
  }

  monero_wallet::~monero_wallet() {
    MTRACE("~monero_wallet()");
    close();
  }

  // ----------------------------- WALLET METHODS -----------------------------

  void monero_wallet::set_daemon_connection(const string& uri, const string& username, const string& password) {
    MTRACE("set_daemon_connection(" << uri << ", " << username << ", " << password << ")");

    // prepare uri, login, and is_trusted for wallet2
    boost::optional<epee::net_utils::http::login> login{};
    login.emplace(username, password);
    bool is_trusted = false;
    try { is_trusted = tools::is_local_address(uri); }	// wallet is trusted iff local
    catch (const exception &e) { }

    // init wallet2 and set daemon connection
    if (!w2->init(uri, login)) throw runtime_error("Failed to initialize wallet with daemon connection");
    get_is_connected(); // update is_connected cache // TODO: better naming?
  }

  void monero_wallet::set_daemon_connection(const monero_rpc_connection& connection) {
    set_daemon_connection(connection.uri, connection.username == boost::none ? "" : connection.username.get(), connection.password == boost::none ? "" : connection.password.get());
  }

  shared_ptr<monero_rpc_connection> monero_wallet::get_daemon_connection() const {
    MTRACE("monero_wallet::get_daemon_connection()");
    if (w2->get_daemon_address().empty()) return nullptr;
    shared_ptr<monero_rpc_connection> connection = make_shared<monero_rpc_connection>();
    if (!w2->get_daemon_address().empty()) connection->uri = w2->get_daemon_address();
    if (w2->get_daemon_login()) {
      if (!w2->get_daemon_login()->username.empty()) connection->username = w2->get_daemon_login()->username;
      epee::wipeable_string wipeablePassword = w2->get_daemon_login()->password;
      string password = string(wipeablePassword.data(), wipeablePassword.size());
      if (!password.empty()) connection->password = password;
    }
    return connection;
  }

  // TODO: could return Wallet::ConnectionStatus_Disconnected, Wallet::ConnectionStatus_WrongVersion, Wallet::ConnectionStatus_Connected like wallet.cpp::connected()
  bool monero_wallet::get_is_connected() const {
    uint32_t version = 0;
    is_connected = w2->check_connection(&version, NULL, DEFAULT_CONNECTION_TIMEOUT_MILLIS); // TODO: should this be updated elsewhere?
    if (!is_connected) return false;
    if (!w2->light_wallet() && (version >> 16) != CORE_RPC_VERSION_MAJOR) is_connected = false;  // wrong network type
    return is_connected;
  }

  uint64_t monero_wallet::get_daemon_height() const {
    if (!is_connected) throw runtime_error("wallet is not connected to daemon");
    std::string err;
    uint64_t result = w2->get_daemon_blockchain_height(err);
    if (!err.empty()) throw runtime_error(err);
    return result;
  }

  uint64_t monero_wallet::get_daemon_target_height() const {
    if (!is_connected) throw runtime_error("wallet is not connected to daemon");
    std::string err;
    uint64_t result = w2->get_daemon_blockchain_target_height(err);
    if (!err.empty()) throw runtime_error(err);
    if (result == 0) result = get_daemon_height();  // TODO monero core: target height can be 0 when daemon is synced.  Use blockchain height instead
    return result;
  }

  bool monero_wallet::get_is_daemon_synced() const {
    if (!is_connected) throw runtime_error("wallet is not connected to daemon");
    uint64_t daemonHeight = get_daemon_height();
    return daemonHeight >= get_daemon_target_height() && daemonHeight > 1;
  }

  bool monero_wallet::get_is_synced() const {
    return is_synced;
  }

  string monero_wallet::get_path() const {
    return w2->path();
  }

  monero_network_type monero_wallet::get_network_type() const {
    return static_cast<monero_network_type>(w2->nettype());
  }

  string monero_wallet::get_language() const {
    return w2->get_seed_language();
  }

  vector<string> monero_wallet::get_languages() const {
    vector<string> languages;
    crypto::ElectrumWords::get_language_list(languages, true);
    return languages;
  }

  // get primary address (default impl?)

  string monero_wallet::get_address(uint32_t account_idx, uint32_t subaddress_idx) const {
    return w2->get_subaddress_as_str({account_idx, subaddress_idx});
  }

  monero_subaddress monero_wallet::get_address_index(const string& address) const {
    MTRACE("get_address_index(" << address << ")");

    // validate address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, w2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // get index of address in wallet
    auto index = w2->get_subaddress_index(info.address);
    if (!index) throw runtime_error("Address doesn't belong to the wallet");

    // return indices in subaddress
    monero_subaddress subaddress;
    cryptonote::subaddress_index cn_index = *index;
    subaddress.account_index = cn_index.major;
    subaddress.index = cn_index.minor;
    return subaddress;
  }

  monero_integrated_address monero_wallet::get_integrated_address(const string& standard_address, const string& payment_id) const {
    MTRACE("get_integrated_address(" << standard_address << ", " << payment_id << ")");

    // TODO monero-core: this logic is based on wallet_rpc_server::on_make_integrated_address() and should be moved to wallet so this is unecessary for api users

    // randomly generate payment id if not given, else validate
    crypto::hash8 paymen_id_h8;
    if (payment_id.empty()) {
      paymen_id_h8 = crypto::rand<crypto::hash8>();
    } else {
      if (!tools::wallet2::parse_short_payment_id(payment_id, paymen_id_h8)) throw runtime_error("Invalid payment ID: " + payment_id);
    }

    // use primary address if standard address not given, else validate
    if (standard_address.empty()) {
      return decode_integrated_address(w2->get_integrated_address_as_str(paymen_id_h8));
    } else {

      // validate standard address
      cryptonote::address_parse_info info;
      if (!cryptonote::get_account_address_from_str(info, w2->nettype(), standard_address)) throw runtime_error("Invalid address: " + standard_address);
      if (info.is_subaddress) throw runtime_error("Subaddress shouldn't be used");
      if (info.has_payment_id) throw runtime_error("Already integrated address");
      if (payment_id.empty()) throw runtime_error("Payment ID shouldn't be left unspecified");

      // create integrated address from given standard address
      return decode_integrated_address(cryptonote::get_account_integrated_address_as_str(w2->nettype(), info.address, paymen_id_h8));
    }
  }

  monero_integrated_address monero_wallet::decode_integrated_address(const string& integrated_address) const {
    MTRACE("decode_integrated_address(" << integrated_address << ")");

    // validate integrated address
    cryptonote::address_parse_info info;
    if (!cryptonote::get_account_address_from_str(info, w2->nettype(), integrated_address)) throw runtime_error("Invalid integrated address: " + integrated_address);
    if (!info.has_payment_id) throw runtime_error("Address is not an integrated address");

    // initialize and return result
    monero_integrated_address result;
    result.standard_address = cryptonote::get_account_address_as_str(w2->nettype(), info.is_subaddress, info.address);
    result.payment_id = epee::string_tools::pod_to_hex(info.payment_id);
    result.integrated_address = integrated_address;
    return result;
  }

  string monero_wallet::get_mnemonic() const {
    epee::wipeable_string wipeablePassword;
    w2->get_seed(wipeablePassword);
    return string(wipeablePassword.data(), wipeablePassword.size());
  }

  string monero_wallet::get_public_view_key() const {
    MTRACE("get_private_view_key()");
    return epee::string_tools::pod_to_hex(w2->get_account().get_keys().m_account_address.m_view_public_key);
  }

  string monero_wallet::get_private_view_key() const {
    MTRACE("get_private_view_key()");
    return epee::string_tools::pod_to_hex(w2->get_account().get_keys().m_view_secret_key);
  }

  string monero_wallet::get_public_spend_key() const {
    MTRACE("get_private_spend_key()");
    return epee::string_tools::pod_to_hex(w2->get_account().get_keys().m_account_address.m_spend_public_key);
  }

  string monero_wallet::get_private_spend_key() const {
    MTRACE("get_private_spend_key()");
    return epee::string_tools::pod_to_hex(w2->get_account().get_keys().m_spend_secret_key);
  }

  void monero_wallet::set_listener(const boost::optional<monero_wallet_listener&> listener) {
    MTRACE("set_listener()");
    w2_listener->set_wallet_listener(listener);
  }

  monero_sync_result monero_wallet::sync() {
    MTRACE("sync()");
    if (!is_connected) throw runtime_error("No connection to daemon");
    return lock_and_sync();
  }

  monero_sync_result monero_wallet::sync(monero_sync_listener& listener) {
    MTRACE("sync(listener)");
    if (!is_connected) throw runtime_error("No connection to daemon");
    return lock_and_sync(boost::none, listener);
  }

  monero_sync_result monero_wallet::sync(uint64_t start_height) {
    MTRACE("sync(" << start_height << ")");
    if (!is_connected) throw runtime_error("No connection to daemon");
    return lock_and_sync(start_height);
  }

  monero_sync_result monero_wallet::sync(uint64_t start_height, monero_sync_listener& listener) {
    MTRACE("sync(" << start_height << ", listener)");
    if (!is_connected) throw runtime_error("No connection to daemon");
    return lock_and_sync(start_height, listener);
  }

  /**
   * Start automatic syncing as its own thread.
   */
  void monero_wallet::start_syncing() {
    if (!syncing_enabled) {
      syncing_enabled = true;
      sync_cv.notify_one();
    }
  }

  /**
   * Stop automatic syncing as its own thread.
   */
  void monero_wallet::stop_syncing() {
    if (!syncing_thread_done) {
      syncing_enabled = false;
    }
  }

  // TODO: support arguments bool hard, bool refresh = true, bool keep_key_images = false
  void monero_wallet::rescan_blockchain() {
    MTRACE("rescan_blockchain()");
    if (!is_connected) throw runtime_error("No connection to daemon");
    rescan_on_sync = true;
    lock_and_sync();
  }

  // isMultisigImportNeeded

  uint64_t monero_wallet::get_height() const {
    return w2->get_blockchain_current_height();
  }

  uint64_t monero_wallet::get_chain_height() const {
    string err;
    if (!is_connected) throw runtime_error("No connection to daemon");
    uint64_t chain_height = w2->get_daemon_blockchain_height(err);
    if (!err.empty()) throw runtime_error(err);
    return chain_height;
  }

  uint64_t monero_wallet::get_restore_height() const {
    return w2->get_refresh_from_block_height();
  }

  void monero_wallet::set_restore_height(uint64_t restore_height) {
    w2->set_refresh_from_block_height(restore_height);
  }

  uint64_t monero_wallet::get_balance() const {
    return w2->balance_all();
  }

  uint64_t monero_wallet::get_balance(uint32_t account_idx) const {
    return w2->balance(account_idx);
  }

  uint64_t monero_wallet::get_balance(uint32_t account_idx, uint32_t subaddress_idx) const {
    map<uint32_t, uint64_t> balancePerSubaddress = w2->balance_per_subaddress(account_idx);
    auto iter = balancePerSubaddress.find(subaddress_idx);
    return iter == balancePerSubaddress.end() ? 0 : iter->second;
  }

  uint64_t monero_wallet::get_unlocked_balance() const {
    return w2->unlocked_balance_all();
  }

  uint64_t monero_wallet::get_unlocked_balance(uint32_t account_idx) const {
    return w2->unlocked_balance(account_idx);
  }

  uint64_t monero_wallet::get_unlocked_balance(uint32_t account_idx, uint32_t subaddress_idx) const {
    map<uint32_t, std::pair<uint64_t, uint64_t>> unlockedBalancePerSubaddress = w2->unlocked_balance_per_subaddress(account_idx);
    auto iter = unlockedBalancePerSubaddress.find(subaddress_idx);
    return iter == unlockedBalancePerSubaddress.end() ? 0 : iter->second.first;
  }

  vector<monero_account> monero_wallet::get_accounts() const {
    MTRACE("get_accounts()");
    return get_accounts(false, string(""));
  }

  vector<monero_account> monero_wallet::get_accounts(bool include_subaddresses) const {
    MTRACE("get_accounts(" << include_subaddresses << ")");
    throw runtime_error("Not implemented");
  }

  vector<monero_account> monero_wallet::get_accounts(const string& tag) const {
    MTRACE("get_accounts(" << tag << ")");
    throw runtime_error("Not implemented");
  }

  vector<monero_account> monero_wallet::get_accounts(bool include_subaddresses, const string& tag) const {
    MTRACE("get_accounts(" << include_subaddresses << ", " << tag << ")");

    // need transfers to inform if subaddresses used
    vector<tools::wallet2::transfer_details> transfers;
    if (include_subaddresses) w2->get_transfers(transfers);

    // build accounts
    vector<monero_account> accounts;
    for (uint32_t account_idx = 0; account_idx < w2->get_num_subaddress_accounts(); account_idx++) {
      monero_account account;
      account.index = account_idx;
      account.primary_address = get_address(account_idx, 0);
      account.balance = w2->balance(account_idx);
      account.unlocked_balance = w2->unlocked_balance(account_idx);
      if (include_subaddresses) account.subaddresses = get_subaddresses_aux(account_idx, vector<uint32_t>(), transfers);
      accounts.push_back(account);
    }

    return accounts;
  }

  monero_account monero_wallet::get_account(const uint32_t account_idx) const {
    return get_account(account_idx, false);
  }

  monero_account monero_wallet::get_account(uint32_t account_idx, bool include_subaddresses) const {
    MTRACE("get_account(" << account_idx << ", " << include_subaddresses << ")");

    // need transfers to inform if subaddresses used
    vector<tools::wallet2::transfer_details> transfers;
    if (include_subaddresses) w2->get_transfers(transfers);

    // build and return account
    monero_account account;
    account.index = account_idx;
    account.primary_address = get_address(account_idx, 0);
    account.balance = w2->balance(account_idx);
    account.unlocked_balance = w2->unlocked_balance(account_idx);
    if (include_subaddresses) account.subaddresses = get_subaddresses_aux(account_idx, vector<uint32_t>(), transfers);
    return account;
  }

  monero_account monero_wallet::create_account(const string& label) {
    MTRACE("create_account(" << label << ")");

    // create account
    w2->add_subaddress_account(label);

    // initialize and return result
    monero_account account;
    account.index = w2->get_num_subaddress_accounts() - 1;
    account.primary_address = w2->get_subaddress_as_str({account.index.get(), 0});
    account.balance = 0;
    account.unlocked_balance = 0;
    return account;
  }

  vector<monero_subaddress> monero_wallet::get_subaddresses(const uint32_t account_idx) const {
    return get_subaddresses(account_idx, vector<uint32_t>());
  }

  vector<monero_subaddress> monero_wallet::get_subaddresses(const uint32_t account_idx, const vector<uint32_t>& subaddress_indices) const {
    MTRACE("get_subaddresses(" << account_idx << ", ...)");
    MTRACE("Subaddress indices size: " << subaddress_indices.size());

    vector<tools::wallet2::transfer_details> transfers;
    w2->get_transfers(transfers);
    return get_subaddresses_aux(account_idx, subaddress_indices, transfers);
  }

  monero_subaddress monero_wallet::getSubaddress(const uint32_t account_idx, const uint32_t subaddress_idx) const {
    throw runtime_error("Not implemented");
  }

  // get_subaddresses

  monero_subaddress monero_wallet::create_subaddress(const uint32_t account_idx, const string& label) {
    MTRACE("create_subaddress(" << account_idx << ", " << label << ")");

    // create subaddress
    w2->add_subaddress(account_idx, label);

    // initialize and return result
    monero_subaddress subaddress;
    subaddress.account_index = account_idx;
    subaddress.index = w2->get_num_subaddresses(account_idx) - 1;
    subaddress.address = w2->get_subaddress_as_str({account_idx, subaddress.index.get()});
    subaddress.label = label;
    subaddress.balance = 0;
    subaddress.unlocked_balance = 0;
    subaddress.num_unspent_outputs = 0;
    subaddress.is_used = false;
    subaddress.num_blocks_to_unlock = 0;
    return subaddress;
  }

  vector<shared_ptr<monero_tx_wallet>> monero_wallet::get_txs() const {
    monero_tx_request request;
    return get_txs(request);
  }

  vector<shared_ptr<monero_tx_wallet>> monero_wallet::get_txs(const monero_tx_request& request) const {
    MTRACE("get_txs(request)");
    
    // copy and normalize tx request
    shared_ptr<monero_tx_request> requestSp = make_shared<monero_tx_request>(request); // convert to shared pointer for copy
    shared_ptr<monero_tx_request> req = requestSp->copy(requestSp, make_shared<monero_tx_request>());
    if (req->transfer_request == boost::none) req->transfer_request = make_shared<monero_transfer_request>();
    shared_ptr<monero_transfer_request> transfer_req = req->transfer_request.get();

    // print req
    if (req->block != boost::none) MTRACE("Tx req's rooted at [block]: " << req->block.get()->serialize());
    else MTRACE("Tx req: " << req->serialize());
    
    // temporarily disable transfer request
    req->transfer_request = boost::none;

    // fetch all transfers that meet tx request
    monero_transfer_request temp_transfer_req;
    temp_transfer_req.tx_request = make_shared<monero_tx_request>(*req);
    vector<shared_ptr<monero_transfer>> transfers = get_transfers(temp_transfer_req);

    // collect unique txs from transfers while retaining order
    vector<shared_ptr<monero_tx_wallet>> txs = vector<shared_ptr<monero_tx_wallet>>();
    unordered_set<shared_ptr<monero_tx_wallet>> txsSet;
    for (const shared_ptr<monero_transfer>& transfer : transfers) {
      if (txsSet.find(transfer->tx) == txsSet.end()) {
        txs.push_back(transfer->tx);
        txsSet.insert(transfer->tx);
      }
    }

    // cache types into maps for merging and lookup
    map<string, shared_ptr<monero_tx_wallet>> tx_map;
    map<uint64_t, shared_ptr<monero_block>> block_map;
    for (const shared_ptr<monero_tx_wallet>& tx : txs) {
      merge_tx(tx, tx_map, block_map, false);
    }

    // fetch and merge outputs if requested
    monero_output_request temp_output_req;
    temp_output_req.tx_request = make_shared<monero_tx_request>(*req);
    if (req->include_outputs != boost::none && *req->include_outputs) {

      // fetch outputs
      vector<shared_ptr<monero_output_wallet>> outputs = get_outputs(temp_output_req);

      // merge output txs one time while retaining order
      unordered_set<shared_ptr<monero_tx_wallet>> outputTxs;
      for (const shared_ptr<monero_output_wallet>& output : outputs) {
        shared_ptr<monero_tx_wallet> tx = static_pointer_cast<monero_tx_wallet>(output->tx);
        if (outputTxs.find(tx) == outputTxs.end()) {
          merge_tx(tx, tx_map, block_map, true);
          outputTxs.insert(tx);
        }
      }
    }

    // filter txs that don't meet transfer req  // TODO: port this updated version to js
    req->transfer_request = transfer_req;
    vector<shared_ptr<monero_tx_wallet>> txs_requested;
    vector<shared_ptr<monero_tx_wallet>>::iterator tx_iter = txs.begin();
    while (tx_iter != txs.end()) {
      shared_ptr<monero_tx_wallet> tx = *tx_iter;
      if (req->meets_criteria(tx.get())) {
        txs_requested.push_back(tx);
        tx_iter++;
      } else {
        tx_iter = txs.erase(tx_iter);
        if (tx->block != boost::none) tx->block.get()->txs.erase(std::remove(tx->block.get()->txs.begin(), tx->block.get()->txs.end(), tx), tx->block.get()->txs.end()); // TODO, no way to use tx_iter?
      }
    }
    txs = txs_requested;

    // verify all specified tx ids found
    if (!req->tx_ids.empty()) {
      for (const string& tx_id : req->tx_ids) {
        bool found = false;
        for (const shared_ptr<monero_tx_wallet>& tx : txs) {
          if (tx_id == *tx->id) {
            found = true;
            break;
          }
        }
        if (!found) throw runtime_error("Tx not found in wallet: " + tx_id);
      }
    }

    // special case: re-fetch txs if inconsistency caused by needing to make multiple wallet calls
    // TODO monero core: offer wallet.get_txs(...)
    for (const shared_ptr<monero_tx_wallet>& tx : txs) {
      if (*tx->is_confirmed && tx->block == boost::none) return get_txs(*req);
    }

    // otherwise order txs if tx ids given then return
    if (!req->tx_ids.empty()) {
      vector<shared_ptr<monero_tx_wallet>> ordered_txs;
      for (const string& tx_id : req->tx_ids) {
        map<string, shared_ptr<monero_tx_wallet>>::const_iterator tx_iter = tx_map.find(tx_id);
        ordered_txs.push_back(tx_iter->second);
      }
      txs = ordered_txs;
    }
    return txs;
  }

  vector<shared_ptr<monero_transfer>> monero_wallet::get_transfers(const monero_transfer_request& request) const {
    MTRACE("monero_wallet::get_transfers(request)");

    // LOG request
    if (request.tx_request != boost::none) {
      if ((*request.tx_request)->block == boost::none) MTRACE("Transfer request's tx request rooted at [tx]:" << (*request.tx_request)->serialize());
      else MTRACE("Transfer request's tx request rooted at [block]: " << (*(*request.tx_request)->block)->serialize());
    }

    // copy and normalize request
    shared_ptr<monero_transfer_request> req;
    if (request.tx_request == boost::none) req = request.copy(make_shared<monero_transfer_request>(request), make_shared<monero_transfer_request>());
    else {
      shared_ptr<monero_tx_request> tx_req = request.tx_request.get()->copy(request.tx_request.get(), make_shared<monero_tx_request>());
      if (request.tx_request.get()->transfer_request != boost::none && request.tx_request.get()->transfer_request.get().get() == &request) {
        req = tx_req->transfer_request.get();
      } else {
        if (request.tx_request.get()->transfer_request != boost::none) throw new runtime_error("Transfer request's tx request must be a circular reference or null");
        shared_ptr<monero_transfer_request> requestSp = make_shared<monero_transfer_request>(request);  // convert request to shared pointer for copy
        req = requestSp->copy(requestSp, make_shared<monero_transfer_request>());
        req->tx_request = tx_req;
      }
    }
    if (req->tx_request == boost::none) req->tx_request = make_shared<monero_tx_request>();
    shared_ptr<monero_tx_request> tx_req = req->tx_request.get();
    tx_req->transfer_request = boost::none; // break circular link for meets_criteria()

    // build parameters for w2->get_payments()
    uint64_t min_height = tx_req->min_height == boost::none ? 0 : *tx_req->min_height;
    uint64_t max_height = tx_req->max_height == boost::none ? CRYPTONOTE_MAX_BLOCK_NUMBER : min((uint64_t) CRYPTONOTE_MAX_BLOCK_NUMBER, *tx_req->max_height);
    if (min_height > 0) min_height--; // TODO monero core: wallet2::get_payments() min_height is exclusive, so manually offset to match intended range (issues 5751, #5598)
    boost::optional<uint32_t> account_index = boost::none;
    if (req->account_index != boost::none) account_index = *req->account_index;
    std::set<uint32_t> subaddress_indices;
    for (int i = 0; i < req->subaddress_indices.size(); i++) {
      subaddress_indices.insert(req->subaddress_indices[i]);
    }

    // translate from monero_tx_request to in, out, pending, pool, failed terminology used by monero-wallet-rpc
    bool can_be_confirmed = !bool_equals(false, tx_req->is_confirmed) && !bool_equals(true, tx_req->in_tx_pool) && !bool_equals(true, tx_req->is_failed) && !bool_equals(false, tx_req->is_relayed);
    bool can_be_in_tx_pool = !bool_equals(true, tx_req->is_confirmed) && !bool_equals(false, tx_req->in_tx_pool) && !bool_equals(true, tx_req->is_failed) && !bool_equals(false, tx_req->is_relayed) && tx_req->get_height() == boost::none && tx_req->min_height == boost::none;
    bool can_be_incoming = !bool_equals(false, req->is_incoming) && !bool_equals(true, req->getIsOutgoing()) && !bool_equals(true, req->has_destinations);
    bool can_be_outgoing = !bool_equals(false, req->getIsOutgoing()) && !bool_equals(true, req->is_incoming);
    bool is_in = can_be_incoming && can_be_confirmed;
    bool is_out = can_be_outgoing && can_be_confirmed;
    bool is_pending = can_be_outgoing && can_be_in_tx_pool;
    bool is_pool = can_be_incoming && can_be_in_tx_pool;
    bool is_failed = !bool_equals(false, tx_req->is_failed) && !bool_equals(true, tx_req->is_confirmed) && !bool_equals(true, tx_req->in_tx_pool);

    // cache unique txs and blocks
    uint64_t height = get_height();
    map<string, shared_ptr<monero_tx_wallet>> tx_map;
    map<uint64_t, shared_ptr<monero_block>> block_map;

    // get confirmed incoming transfers
    if (is_in) {
      std::list<std::pair<crypto::hash, tools::wallet2::payment_details>> payments;
      w2->get_payments(payments, min_height, max_height, account_index, subaddress_indices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::payment_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
        shared_ptr<monero_tx_wallet> tx = build_tx_with_incoming_transfer(*w2, height, i->first, i->second);
        merge_tx(tx, tx_map, block_map, false);
      }
    }

    // get confirmed outgoing transfers
    if (is_out) {
      std::list<std::pair<crypto::hash, tools::wallet2::confirmed_transfer_details>> payments;
      w2->get_payments_out(payments, min_height, max_height, account_index, subaddress_indices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::confirmed_transfer_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
        shared_ptr<monero_tx_wallet> tx = build_tx_with_outgoing_transfer(*w2, height, i->first, i->second);
        merge_tx(tx, tx_map, block_map, false);
      }
    }

    // get unconfirmed or failed outgoing transfers
    if (is_pending || is_failed) {
      std::list<std::pair<crypto::hash, tools::wallet2::unconfirmed_transfer_details>> upayments;
      w2->get_unconfirmed_payments_out(upayments, account_index, subaddress_indices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::unconfirmed_transfer_details>>::const_iterator i = upayments.begin(); i != upayments.end(); ++i) {
        shared_ptr<monero_tx_wallet> tx = build_tx_with_outgoing_transfer_unconfirmed(*w2, i->first, i->second);
        if (tx_req->is_failed != boost::none && tx_req->is_failed.get() != tx->is_failed.get()) continue; // skip merging if tx unrequested
        merge_tx(tx, tx_map, block_map, false);
      }
    }

    // get unconfirmed incoming transfers
    if (is_pool) {
      w2->update_pool_state(); // TODO monero-core: this should be encapsulated in wallet when unconfirmed transfers requested
      std::list<std::pair<crypto::hash, tools::wallet2::pool_payment_details>> payments;
      w2->get_unconfirmed_payments(payments, account_index, subaddress_indices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::pool_payment_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
        shared_ptr<monero_tx_wallet> tx = build_tx_with_incoming_transfer_unconfirmed(*w2, i->first, i->second);
        merge_tx(tx, tx_map, block_map, false);
      }
    }

    // sort txs by block height
    vector<shared_ptr<monero_tx_wallet>> txs ;
    for (map<string, shared_ptr<monero_tx_wallet>>::const_iterator tx_iter = tx_map.begin(); tx_iter != tx_map.end(); tx_iter++) {
      txs.push_back(tx_iter->second);
    }
    sort(txs.begin(), txs.end(), tx_height_less_than);

    // filter and return transfers
    vector<shared_ptr<monero_transfer>> transfers;
    for (const shared_ptr<monero_tx_wallet>& tx : txs) {

      // sort transfers
      sort(tx->incoming_transfers.begin(), tx->incoming_transfers.end(), incoming_transfer_before);

      // collect outgoing transfer, erase if filtered TODO: js does not erase unrequested data, port to js
      if (tx->outgoing_transfer != boost::none && req->meets_criteria(tx->outgoing_transfer.get().get())) transfers.push_back(tx->outgoing_transfer.get());
      else tx->outgoing_transfer = boost::none;

      // collect incoming transfers, erase if unrequested
      vector<shared_ptr<monero_incoming_transfer>>::iterator iter = tx->incoming_transfers.begin();
      while (iter != tx->incoming_transfers.end()) {
        if (req->meets_criteria((*iter).get())) {
          transfers.push_back(*iter);
          iter++;
        } else {
          iter = tx->incoming_transfers.erase(iter);
        }
      }

      // remove unrequested txs from block
      if (tx->block != boost::none && tx->outgoing_transfer == boost::none && tx->incoming_transfers.empty()) {
        tx->block.get()->txs.erase(std::remove(tx->block.get()->txs.begin(), tx->block.get()->txs.end(), tx), tx->block.get()->txs.end()); // TODO, no way to use const_iterator?
      }
    }
    MTRACE("monero_wallet.cpp get_transfers() returning " << transfers.size() << " transfers");

    return transfers;
  }

  vector<shared_ptr<monero_output_wallet>> monero_wallet::get_outputs(const monero_output_request& request) const {
    MTRACE("monero_wallet::get_outputs(request)");

    // print request
    MTRACE("Output request: " << request.serialize());
    if (request.tx_request != boost::none) {
      if ((*request.tx_request)->block == boost::none) MTRACE("Output request's tx request rooted at [tx]:" << (*request.tx_request)->serialize());
      else MTRACE("Output request's tx request rooted at [block]: " << (*(*request.tx_request)->block)->serialize());
    }

    // copy and normalize request
    shared_ptr<monero_output_request> req;
    if (request.tx_request == boost::none) req = request.copy(make_shared<monero_output_request>(request), make_shared<monero_output_request>());
    else {
      shared_ptr<monero_tx_request> tx_req = request.tx_request.get()->copy(request.tx_request.get(), make_shared<monero_tx_request>());
      if (request.tx_request.get()->output_request != boost::none && request.tx_request.get()->output_request.get().get() == &request) {
        req = tx_req->output_request.get();
      } else {
        if (request.tx_request.get()->output_request != boost::none) throw new runtime_error("Output request's tx request must be a circular reference or null");
        shared_ptr<monero_output_request> requestSp = make_shared<monero_output_request>(request);  // convert request to shared pointer for copy
        req = requestSp->copy(requestSp, make_shared<monero_output_request>());
        req->tx_request = tx_req;
      }
    }
    if (req->tx_request == boost::none) req->tx_request = make_shared<monero_tx_request>();
    shared_ptr<monero_tx_request> tx_req = req->tx_request.get();
    tx_req->output_request = boost::none; // break circular link for meets_criteria()

    // get output data from wallet2
    tools::wallet2::transfer_container outputs_w2;
    w2->get_transfers(outputs_w2);

    // cache unique txs and blocks
    map<string, shared_ptr<monero_tx_wallet>> tx_map;
    map<uint64_t, shared_ptr<monero_block>> block_map;
    for (const auto& output_w2 : outputs_w2) {
      // TODO: skip tx building if w2 output filtered by indices, etc
      shared_ptr<monero_tx_wallet> tx = build_tx_with_vout(*w2, output_w2);
      merge_tx(tx, tx_map, block_map, false);
    }

    // sort txs by block height
    vector<shared_ptr<monero_tx_wallet>> txs ;
    for (map<string, shared_ptr<monero_tx_wallet>>::const_iterator tx_iter = tx_map.begin(); tx_iter != tx_map.end(); tx_iter++) {
      txs.push_back(tx_iter->second);
    }
    sort(txs.begin(), txs.end(), tx_height_less_than);

    // filter and return outputs
    vector<shared_ptr<monero_output_wallet>> vouts;
    for (const shared_ptr<monero_tx_wallet>& tx : txs) {

      // sort outputs
      sort(tx->vouts.begin(), tx->vouts.end(), vout_before);

      // collect requested outputs, remove unrequested outputs
      vector<shared_ptr<monero_output>>::iterator voutIter = tx->vouts.begin();
      while (voutIter != tx->vouts.end()) {
        shared_ptr<monero_output_wallet> vout_wallet = static_pointer_cast<monero_output_wallet>(*voutIter);
        if (req->meets_criteria(vout_wallet.get())) {
          vouts.push_back(vout_wallet);
          voutIter++;
        } else {
          voutIter = tx->vouts.erase(voutIter); // remove unrequested vouts
        }
      }

      // remove txs without requested vout
      if (tx->vouts.empty() && tx->block != boost::none) tx->block.get()->txs.erase(std::remove(tx->block.get()->txs.begin(), tx->block.get()->txs.end(), tx), tx->block.get()->txs.end()); // TODO, no way to use const_iterator?
    }
    return vouts;
  }

  string monero_wallet::get_outputs_hex() const {
    return epee::string_tools::buff_to_hex_nodelimer(w2->export_outputs_to_str(true));
  }

  int monero_wallet::import_outputs_hex(const string& outputs_hex) {

    // validate and parse hex data
    cryptonote::blobdata blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(outputs_hex, blob)) {
      throw runtime_error("Failed to parse hex.");
    }

    // import hex and return result
    return w2->import_outputs_from_str(blob);
  }

  vector<shared_ptr<monero_key_image>> monero_wallet::get_key_images() const {
    MTRACE("monero_wallet::get_key_images()");

    // build key images from wallet2 types
    vector<shared_ptr<monero_key_image>> key_images;
    std::pair<size_t, std::vector<std::pair<crypto::key_image, crypto::signature>>> ski = w2->export_key_images(true);
    for (size_t n = 0; n < ski.second.size(); ++n) {
      shared_ptr<monero_key_image> key_image = make_shared<monero_key_image>();
      key_images.push_back(key_image);
      key_image->hex = epee::string_tools::pod_to_hex(ski.second[n].first);
      key_image->signature = epee::string_tools::pod_to_hex(ski.second[n].second);
    }
    return key_images;
  }

  shared_ptr<monero_key_image_import_result> monero_wallet::import_key_images(const vector<shared_ptr<monero_key_image>>& key_images) {
    MTRACE("monero_wallet::import_key_images()");

    // validate and prepare key images for wallet2
    std::vector<std::pair<crypto::key_image, crypto::signature>> ski;
    ski.resize(key_images.size());
    for (size_t n = 0; n < ski.size(); ++n) {
      if (!epee::string_tools::hex_to_pod(key_images[n]->hex.get(), ski[n].first)) {
        throw runtime_error("failed to parse key image");
      }
      if (!epee::string_tools::hex_to_pod(key_images[n]->signature.get(), ski[n].second)) {
        throw runtime_error("failed to parse signature");
      }
    }

    // import key images
    uint64_t spent = 0, unspent = 0;
    uint64_t height = w2->import_key_images(ski, 0, spent, unspent); // TODO: use offset? refer to wallet_rpc_server::on_import_key_images() req.offset

    // translate results
    shared_ptr<monero_key_image_import_result> result = make_shared<monero_key_image_import_result>();
    result->height = height;
    result->spent_amount = spent;
    result->unspent_amount = unspent;
    return result;
  }

  vector<shared_ptr<monero_tx_wallet>> monero_wallet::send_split(const monero_send_request& request) {
    MTRACE("monero_wallet::send_split(request)");
    MTRACE("monero_send_request: " << request.serialize());

    wallet_rpc::COMMAND_RPC_TRANSFER::request req;
    wallet_rpc::COMMAND_RPC_TRANSFER::response res;
    epee::json_rpc::error err;

    // prepare parameters for wallet rpc's validate_transfer()
    string payment_id = request.payment_id == boost::none ? string("") : request.payment_id.get();
    list<tools::wallet_rpc::transfer_destination> tr_destinations;
    for (const shared_ptr<monero_destination>& destination : request.destinations) {
      tools::wallet_rpc::transfer_destination tr_destination;
      tr_destination.amount = destination->amount.get();
      tr_destination.address = destination->address.get();
      tr_destinations.push_back(tr_destination);
    }

    // validate the requested txs and populate dsts & extra
    std::vector<cryptonote::tx_destination_entry> dsts;
    std::vector<uint8_t> extra;
    if (!validate_transfer(w2.get(), tr_destinations, payment_id, dsts, extra, true, err)) {
      throw runtime_error("Need to handle send_split() validate_transfer error");  // TODO
    }

    // prepare parameters for wallet2's create_transactions_2()
    uint64_t mixin = w2->adjust_mixin(request.ring_size == boost::none ? 0 : request.ring_size.get() - 1);
    uint32_t priority = w2->adjust_priority(request.priority == boost::none ? 0 : request.priority.get());
    uint64_t unlock_time = request.unlock_time == boost::none ? 0 : request.unlock_time.get();
    if (request.account_index == boost::none) throw runtime_error("Must specify the account index to send from");
    uint32_t account_index = request.account_index.get();
    std::set<uint32_t> subaddress_indices;
    for (const uint32_t& subaddress_idx : request.subaddress_indices) subaddress_indices.insert(subaddress_idx);

    // prepare transactions
    vector<wallet2::pending_tx> ptx_vector = w2->create_transactions_2(dsts, mixin, unlock_time, priority, extra, account_index, subaddress_indices);
    if (ptx_vector.empty()) throw runtime_error("No transaction created");

    // check if request cannot be fulfilled due to splitting
    if (request.can_split != boost::none && request.can_split.get() == false && ptx_vector.size() != 1) {
      throw runtime_error("Transaction would be too large.  Try send_split()");
    }

    // config for fill_response()
    bool get_tx_keys = true;
    bool get_tx_hex = true;
    bool get_tx_metadata = true;
    bool do_not_relay = request.do_not_relay == boost::none ? false : request.do_not_relay.get();

    // commit txs (if relaying) and get response using wallet rpc's fill_response()
    list<string> tx_keys;
    list<uint64_t> tx_amounts;
    list<uint64_t> tx_fees;
    string multisig_tx_set;
    string unsigned_tx_set;
    list<string> tx_ids;
    list<string> tx_blobs;
    list<string> tx_metadatas;
    if (!fill_response(w2.get(), ptx_vector, get_tx_keys, tx_keys, tx_amounts, tx_fees, multisig_tx_set, unsigned_tx_set, do_not_relay, tx_ids, get_tx_hex, tx_blobs, get_tx_metadata, tx_metadatas, err)) {
      throw runtime_error("need to handle error filling response!");  // TODO
    }

    // build sent txs from results  // TODO: break this into separate utility function
    vector<shared_ptr<monero_tx_wallet>> txs;
    auto tx_ids_iter = tx_ids.begin();
    auto tx_keys_iter = tx_keys.begin();
    auto tx_amounts_iter = tx_amounts.begin();
    auto tx_fees_iter = tx_fees.begin();
    auto tx_blobs_iter = tx_blobs.begin();
    auto tx_metadatas_iter = tx_metadatas.begin();
    while (tx_ids_iter != tx_ids.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
      txs.push_back(tx);
      tx->id = *tx_ids_iter;
      tx->key = *tx_keys_iter;
      tx->fee = *tx_fees_iter;
      tx->full_hex = *tx_blobs_iter;
      tx->metadata = *tx_metadatas_iter;
      shared_ptr<monero_outgoing_transfer> out_transfer = make_shared<monero_outgoing_transfer>();
      tx->outgoing_transfer = out_transfer;
      out_transfer->amount = *tx_amounts_iter;

      // init other known fields
      tx->payment_id = request.payment_id;
      tx->is_confirmed = false;
      tx->is_miner_tx = false;
      tx->is_failed = false;   // TODO: test and handle if true
      tx->do_not_relay = request.do_not_relay != boost::none && request.do_not_relay.get() == true;
      tx->is_relayed = tx->do_not_relay.get() != true;
      tx->in_tx_pool = !tx->do_not_relay.get();
      if (!tx->is_failed.get() && tx->is_relayed.get()) tx->is_double_spend_seen = false;  // TODO: test and handle if true
      tx->num_confirmations = 0;
      tx->mixin = request.mixin;
      tx->unlock_time = request.unlock_time == boost::none ? 0 : request.unlock_time.get();
      if (tx->is_relayed.get()) tx->last_relayed_timestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      out_transfer->account_index = request.account_index;
      if (request.subaddress_indices.size() == 1) out_transfer->subaddress_indices.push_back(request.subaddress_indices[0]);  // subaddress index is known iff 1 requested  // TODO: get all known subaddress indices here
      out_transfer->destinations = request.destinations;

      // iterate to next element
      tx_keys_iter++;
      tx_amounts_iter++;
      tx_fees_iter++;
      tx_ids_iter++;
      tx_blobs_iter++;
      tx_metadatas_iter++;
    }
    return txs;
  }

  shared_ptr<monero_tx_wallet> monero_wallet::sweep_output(const monero_send_request& request) const  {
    MTRACE("sweep_output()");
    MTRACE("monero_send_request: " << request.serialize());

    // validate input request
    if (request.key_image == boost::none || request.key_image.get().empty()) throw runtime_error("Must provide key image of output to sweep");
    if (request.destinations.size() != 1 || request.destinations[0]->address == boost::none || request.destinations[0]->address.get().empty()) throw runtime_error("Must provide exactly one destination to sweep output to");

    // validate the transfer requested and populate dsts & extra
    string payment_id = request.payment_id == boost::none ? string("") : request.payment_id.get();
    std::vector<cryptonote::tx_destination_entry> dsts;
    std::vector<uint8_t> extra;
    std::list<wallet_rpc::transfer_destination> destination;
    destination.push_back(wallet_rpc::transfer_destination());
    destination.back().amount = 0;
    destination.back().address = request.destinations[0]->address.get();
    epee::json_rpc::error er;
    if (!validate_transfer(w2.get(), destination, payment_id, dsts, extra, true, er)) {
      //throw runtime_error(er);  // TODO
      throw runtime_error("Handle validate_transfer error!");
    }

    // validate key image
    crypto::key_image ki;
    if (!epee::string_tools::hex_to_pod(request.key_image.get(), ki)) {
      throw runtime_error("failed to parse key image");
    }

    // create transaction
    uint64_t mixin = w2->adjust_mixin(request.ring_size == boost::none ? 0 : request.ring_size.get() - 1);
    uint32_t priority = w2->adjust_priority(request.priority == boost::none ? 0 : request.priority.get());
    uint64_t unlock_time = request.unlock_time == boost::none ? 0 : request.unlock_time.get();
    std::vector<wallet2::pending_tx> ptx_vector = w2->create_transactions_single(ki, dsts[0].addr, dsts[0].is_subaddress, 1, mixin, unlock_time, priority, extra);

    // validate created transaction
    if (ptx_vector.empty()) throw runtime_error("No outputs found");
    if (ptx_vector.size() > 1) throw runtime_error("Multiple transactions are created, which is not supposed to happen");
    const wallet2::pending_tx &ptx = ptx_vector[0];
    if (ptx.selected_transfers.size() > 1) throw runtime_error("The transaction uses multiple inputs, which is not supposed to happen");

    // config for fill_response()
    bool get_tx_keys = true;
    bool get_tx_hex = true;
    bool get_tx_metadata = true;
    bool do_not_relay = request.do_not_relay == boost::none ? false : request.do_not_relay.get();

    // commit txs (if relaying) and get response using wallet rpc's fill_response()
    list<string> tx_keys;
    list<uint64_t> tx_amounts;
    list<uint64_t> tx_fees;
    string multisig_tx_set;
    string unsigned_tx_set;
    list<string> tx_ids;
    list<string> tx_blobs;
    list<string> tx_metadatas;
    if (!fill_response(w2.get(), ptx_vector, get_tx_keys, tx_keys, tx_amounts, tx_fees, multisig_tx_set, unsigned_tx_set, do_not_relay, tx_ids, get_tx_hex, tx_blobs, get_tx_metadata, tx_metadatas, er)) {
      throw runtime_error("need to handle error filling response!");  // TODO: return err message
    }

    // build sent txs from results  // TODO: use common utility with send_split() to avoid code duplication
    vector<shared_ptr<monero_tx_wallet>> txs;
    auto tx_ids_iter = tx_ids.begin();
    auto tx_keys_iter = tx_keys.begin();
    auto tx_amounts_iter = tx_amounts.begin();
    auto tx_fees_iter = tx_fees.begin();
    auto tx_blobs_iter = tx_blobs.begin();
    auto tx_metadatas_iter = tx_metadatas.begin();
    while (tx_ids_iter != tx_ids.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
      txs.push_back(tx);
      tx->id = *tx_ids_iter;
      tx->key = *tx_keys_iter;
      tx->fee = *tx_fees_iter;
      tx->full_hex = *tx_blobs_iter;
      tx->metadata = *tx_metadatas_iter;
      shared_ptr<monero_outgoing_transfer> out_transfer = make_shared<monero_outgoing_transfer>();
      tx->outgoing_transfer = out_transfer;
      out_transfer->amount = *tx_amounts_iter;

      // init other known fields
      tx->payment_id = request.payment_id;
      tx->is_confirmed = false;
      tx->is_miner_tx = false;
      tx->is_failed = false;   // TODO: test and handle if true
      tx->do_not_relay = request.do_not_relay != boost::none && request.do_not_relay.get() == true;
      tx->is_relayed = tx->do_not_relay.get() != true;
      tx->in_tx_pool = !tx->do_not_relay.get();
      if (!tx->is_failed.get() && tx->is_relayed.get()) tx->is_double_spend_seen = false;  // TODO: test and handle if true
      tx->num_confirmations = 0;
      tx->mixin = request.mixin;
      tx->unlock_time = request.unlock_time == boost::none ? 0 : request.unlock_time.get();
      if (tx->is_relayed.get()) tx->last_relayed_timestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      out_transfer->account_index = request.account_index;
      if (request.subaddress_indices.size() == 1) out_transfer->subaddress_indices.push_back(request.subaddress_indices[0]);  // subaddress index is known iff 1 requested  // TODO: get all known subaddress indices here
      out_transfer->destinations = request.destinations;
      out_transfer->destinations[0]->amount = *tx_amounts_iter;

      // iterate to next element
      tx_keys_iter++;
      tx_amounts_iter++;
      tx_fees_iter++;
      tx_ids_iter++;
      tx_blobs_iter++;
      tx_metadatas_iter++;
    }

    // return tx
    if (txs.size() != 1) throw runtime_error("Expected 1 transaction but was " + boost::lexical_cast<std::string>(txs.size()));
    return txs[0];
  }

  vector<shared_ptr<monero_tx_wallet>> monero_wallet::sweep_dust(bool do_not_relay) {
    MTRACE("monero_wallet::sweep_dust()");

    // create transaction to fill
    std::vector<wallet2::pending_tx> ptx_vector = w2->create_unmixable_sweep_transactions();

    // config for fill_response
    bool get_tx_keys = true;
    bool get_tx_hex = true;
    bool get_tx_metadata = true;

    // commit txs (if relaying) and get response using wallet rpc's fill_response()
    list<string> tx_keys;
    list<uint64_t> tx_amounts;
    list<uint64_t> tx_fees;
    string multisig_tx_set;
    string unsigned_tx_set;
    list<string> tx_ids;
    list<string> tx_blobs;
    list<string> tx_metadatas;
    epee::json_rpc::error er;
    if (!fill_response(w2.get(), ptx_vector, get_tx_keys, tx_keys, tx_amounts, tx_fees, multisig_tx_set, unsigned_tx_set, do_not_relay, tx_ids, get_tx_hex, tx_blobs, get_tx_metadata, tx_metadatas, er)) {
      throw runtime_error("need to handle error filling response!");  // TODO: return err message
    }

    // build sent txs from results  // TODO: use common utility with send_split() to avoid code duplication
    vector<shared_ptr<monero_tx_wallet>> txs;
    auto tx_ids_iter = tx_ids.begin();
    auto tx_keys_iter = tx_keys.begin();
    auto tx_amounts_iter = tx_amounts.begin();
    auto tx_fees_iter = tx_fees.begin();
    auto tx_blobs_iter = tx_blobs.begin();
    auto tx_metadatas_iter = tx_metadatas.begin();
    while (tx_ids_iter != tx_ids.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
      txs.push_back(tx);
      tx->id = *tx_ids_iter;
      tx->key = *tx_keys_iter;
      tx->fee = *tx_fees_iter;
      tx->full_hex = *tx_blobs_iter;
      tx->metadata = *tx_metadatas_iter;
      shared_ptr<monero_outgoing_transfer> out_transfer = make_shared<monero_outgoing_transfer>();
      tx->outgoing_transfer = out_transfer;
      out_transfer->amount = *tx_amounts_iter;

      // init other known fields
      tx->is_confirmed = false;
      tx->is_miner_tx = false;
      tx->is_failed = false;   // TODO: test and handle if true
      tx->do_not_relay = do_not_relay;
      tx->is_relayed = tx->do_not_relay.get() != true;
      tx->in_tx_pool = !tx->do_not_relay.get();
      if (!tx->is_failed.get() && tx->is_relayed.get()) tx->is_double_spend_seen = false;  // TODO: test and handle if true
      tx->num_confirmations = 0;
      //tx->mixin = request.mixin;  // TODO: how to get?
      tx->unlock_time = 0;
      if (tx->is_relayed.get()) tx->last_relayed_timestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      out_transfer->destinations[0]->amount = *tx_amounts_iter;

      // iterate to next element
      tx_keys_iter++;
      tx_amounts_iter++;
      tx_fees_iter++;
      tx_ids_iter++;
      tx_blobs_iter++;
      tx_metadatas_iter++;
    }

    return txs;
  }

  vector<string> monero_wallet::relay_txs(const vector<string>& tx_metadatas) {
    MTRACE("relay_txs()");

    // relay each metadata as a tx
    vector<string> tx_ids;
    for (const auto& txMetadata : tx_metadatas) {

      // parse tx metadata hex
      cryptonote::blobdata blob;
      if (!epee::string_tools::parse_hexstr_to_binbuff(txMetadata, blob)) {
        throw runtime_error("Failed to parse hex.");
      }

      // deserialize tx
      tools::wallet2::pending_tx ptx;
      try {
        std::istringstream iss(blob);
        boost::archive::portable_binary_iarchive ar(iss);
        ar >> ptx;
      } catch (...) {
        throw runtime_error("Failed to parse tx metadata.");
      }

      // commit tx
      try {
        w2->commit_tx(ptx);
      } catch (const std::exception& e) {
        throw runtime_error("Failed to commit tx.");
      }

      // collect resulting id
      tx_ids.push_back(epee::string_tools::pod_to_hex(cryptonote::get_transaction_hash(ptx.tx)));
    }

    // return relayed tx ids
    return tx_ids;
  }

  string monero_wallet::get_tx_note(const string& tx_id) const {
    MTRACE("monero_wallet::get_tx_note()");
    cryptonote::blobdata tx_blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(tx_id, tx_blob) || tx_blob.size() != sizeof(crypto::hash)) {
      throw runtime_error("TX ID has invalid format");
    }
    crypto::hash tx_hash = *reinterpret_cast<const crypto::hash*>(tx_blob.data());
    return w2->get_tx_note(tx_hash);
  }

  vector<string> monero_wallet::get_tx_notes(const vector<string>& tx_ids) const {
    MTRACE("monero_wallet::get_tx_notes()");
    vector<string> notes;
    for (const auto& tx_id : tx_ids) notes.push_back(get_tx_note(tx_id));
    return notes;
  }

  void monero_wallet::set_tx_note(const string& tx_id, const string& note) {
    MTRACE("monero_wallet::set_tx_note()");
    cryptonote::blobdata tx_blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(tx_id, tx_blob) || tx_blob.size() != sizeof(crypto::hash)) {
      throw runtime_error("TX ID has invalid format");
    }
    crypto::hash tx_hash = *reinterpret_cast<const crypto::hash*>(tx_blob.data());
    w2->set_tx_note(tx_hash, note);
  }

  void monero_wallet::set_tx_notes(const vector<string>& tx_ids, const vector<string>& notes) {
    MTRACE("monero_wallet::set_tx_notes()");
    if (tx_ids.size() != notes.size()) throw runtime_error("Different amount of txids and notes");
    for (int i = 0; i < tx_ids.size(); i++) {
      set_tx_note(tx_ids[i], notes[i]);
    }
  }

  string monero_wallet::sign(const string& msg) const {
    return w2->sign(msg);
  }

  bool monero_wallet::verify(const string& msg, const string& address, const string& signature) const {

    // validate and parse address or url
    cryptonote::address_parse_info info;
    string err;
    if (!get_account_address_from_str_or_url(info, w2->nettype(), address,
      [&err](const std::string &url, const std::vector<std::string> &addresses, bool dnssec_valid)->std::string {
        if (!dnssec_valid) {
          err = std::string("Invalid DNSSEC for ") + url;
          return {};
        }
        if (addresses.empty()) {
          err = std::string("No Monero address found at ") + url;
          return {};
        }
        return addresses[0];
      }))
    {
      throw runtime_error(err);
    }

    // verify and return result
    return w2->verify(msg, info.address, signature);
  }

  string monero_wallet::get_tx_key(const string& tx_id) const {
    MTRACE("monero_wallet::get_tx_key()");

    // validate and parse tx id hash
    crypto::hash tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_id, tx_hash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // get tx key and additional keys
    crypto::secret_key txKey;
    std::vector<crypto::secret_key> additional_tx_keys;
    if (!w2->get_tx_key(tx_hash, txKey, additional_tx_keys)) {
      throw runtime_error("No tx secret key is stored for this tx");
    }

    // build and return tx key with additional keys
    epee::wipeable_string s;
    s += epee::to_hex::wipeable_string(txKey);
    for (size_t i = 0; i < additional_tx_keys.size(); ++i) {
      s += epee::to_hex::wipeable_string(additional_tx_keys[i]);
    }
    return std::string(s.data(), s.size());
  }

  shared_ptr<monero_check_tx> monero_wallet::check_tx_key(const string& tx_id, const string& txKey, const string& address) const {
    MTRACE("monero_wallet::check_tx_key()");

    // validate and parse tx id
    crypto::hash tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_id, tx_hash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // validate and parse tx key
    epee::wipeable_string tx_key_str = txKey;
    if (tx_key_str.size() < 64 || tx_key_str.size() % 64) {
      throw runtime_error("Tx key has invalid format");
    }
    const char *data = tx_key_str.data();
    crypto::secret_key tx_key;
    if (!epee::wipeable_string(data, 64).hex_to_pod(unwrap(unwrap(tx_key)))) {
      throw runtime_error("Tx key has invalid format");
    }

    // get additional keys
    size_t offset = 64;
    std::vector<crypto::secret_key> additional_tx_keys;
    while (offset < tx_key_str.size()) {
      additional_tx_keys.resize(additional_tx_keys.size() + 1);
      if (!epee::wipeable_string(data + offset, 64).hex_to_pod(unwrap(unwrap(additional_tx_keys.back())))) {
        throw runtime_error("Tx key has invalid format");
      }
      offset += 64;
    }

    // validate and parse address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, w2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // initialize and return tx check using wallet2
    uint64_t received_amount;
    bool in_tx_pool;
    uint64_t num_confirmations;
    w2->check_tx_key(tx_hash, tx_key, additional_tx_keys, info.address, received_amount, in_tx_pool, num_confirmations);
    shared_ptr<monero_check_tx> checkTx = make_shared<monero_check_tx>();
    checkTx->is_good = true; // check is good if we get this far
    checkTx->received_amount = received_amount;
    checkTx->in_tx_pool = in_tx_pool;
    checkTx->num_confirmations = num_confirmations;
    return checkTx;
  }

  string monero_wallet::get_tx_proof(const string& tx_id, const string& address, const string& message) const {

    // validate and parse tx id hash
    crypto::hash tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_id, tx_hash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // validate and parse address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, w2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // get tx proof
    return w2->get_tx_proof(tx_hash, info.address, info.is_subaddress, message);
  }

  shared_ptr<monero_check_tx> monero_wallet::check_tx_proof(const string& tx_id, const string& address, const string& message, const string& signature) const {
    MTRACE("monero_wallet::check_tx_proof()");

    // validate and parse tx id
    crypto::hash tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_id, tx_hash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // validate and parse address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, w2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // initialize and return tx check using wallet2
    shared_ptr<monero_check_tx> checkTx = make_shared<monero_check_tx>();
    uint64_t received_amount;
    bool in_tx_pool;
    uint64_t num_confirmations;
    checkTx->is_good = w2->check_tx_proof(tx_hash, info.address, info.is_subaddress, message, signature, received_amount, in_tx_pool, num_confirmations);
    if (checkTx->is_good) {
      checkTx->received_amount = received_amount;
      checkTx->in_tx_pool = in_tx_pool;
      checkTx->num_confirmations = num_confirmations;
    }
    return checkTx;
  }

  string monero_wallet::get_spend_proof(const string& tx_id, const string& message) const {
    MTRACE("monero_wallet::get_spend_proof()");

    // validate and parse tx id
    crypto::hash tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_id, tx_hash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // return spend proof signature
    return w2->get_spend_proof(tx_hash, message);
  }

  bool monero_wallet::check_spend_proof(const string& tx_id, const string& message, const string& signature) const {
    MTRACE("monero_wallet::check_spend_proof()");

    // validate and parse tx id
    crypto::hash tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_id, tx_hash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // check spend proof
    return w2->check_spend_proof(tx_hash, message, signature);
  }

  string monero_wallet::get_reserve_proof_wallet(const string& message) const {
    MTRACE("monero_wallet::get_reserve_proof_wallet()");
    boost::optional<std::pair<uint32_t, uint64_t>> account_minreserve;
    return w2->get_reserve_proof(account_minreserve, message);
  }

  string monero_wallet::get_reserve_proof_account(uint32_t account_idx, uint64_t amount, const string& message) const {
    MTRACE("monero_wallet::get_reserve_proof_account()");
    boost::optional<std::pair<uint32_t, uint64_t>> account_minreserve;
    if (account_idx >= w2->get_num_subaddress_accounts()) throw runtime_error("Account index is out of bound");
    account_minreserve = std::make_pair(account_idx, amount);
    return w2->get_reserve_proof(account_minreserve, message);
  }

  shared_ptr<monero_check_reserve> monero_wallet::check_reserve_proof(const string& address, const string& message, const string& signature) const {
    MTRACE("monero_wallet::check_reserve_proof()");

    // validate and parse input
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, w2->nettype(), address)) throw runtime_error("Invalid address");
    if (info.is_subaddress) throw runtime_error("Address must not be a subaddress");

    // initialize check reserve using wallet2
    shared_ptr<monero_check_reserve> checkReserve = make_shared<monero_check_reserve>();
    uint64_t total_amount;
    uint64_t unconfirmed_spent_amount;
    checkReserve->is_good = w2->check_reserve_proof(info.address, message, signature, total_amount, unconfirmed_spent_amount);
    if (checkReserve->is_good) {
      checkReserve->total_amount = total_amount;
      checkReserve->unconfirmed_spent_amount = unconfirmed_spent_amount;
    }
    return checkReserve;
  }

  string monero_wallet::create_payment_uri(const monero_send_request& request) const {
    MTRACE("create_payment_uri()");

    // validate request
    if (request.destinations.size() != 1) throw runtime_error("Cannot make URI from supplied parameters: must provide exactly one destination to send funds");
    if (request.destinations.at(0)->address == boost::none) throw runtime_error("Cannot make URI from supplied parameters: must provide destination address");
    if (request.destinations.at(0)->amount == boost::none) throw runtime_error("Cannot make URI from supplied parameters: must provide destination amount");

    // prepare wallet2 params
    string address = request.destinations.at(0)->address.get();
    string payment_id = request.payment_id == boost::none ? "" : request.payment_id.get();
    uint64_t amount = request.destinations.at(0)->amount.get();
    string note = request.note == boost::none ? "" : request.note.get();
    string recipient_name = request.recipient_name == boost::none ? "" : request.recipient_name.get();

    // make uri using wallet2
    std::string error;
    string uri = w2->make_uri(address, payment_id, amount, note, recipient_name, error);
    if (uri.empty()) throw runtime_error("Cannot make URI from supplied parameters: " + error);
    return uri;
  }

  shared_ptr<monero_send_request> monero_wallet::parse_payment_uri(const string& uri) const {
    MTRACE("parse_payment_uri(" << uri << ")");

    // decode uri to parameters
    string address;
    string payment_id;
    uint64_t amount = 0;
    string note;
    string recipient_name;
    vector<string> unknown_parameters;
    string error;
    if (!w2->parse_uri(uri, address, payment_id, amount, note, recipient_name, unknown_parameters, error)) {
      throw runtime_error("Error parsing URI: " + error);
    }

    // initialize send request
    shared_ptr<monero_send_request> send_request = make_shared<monero_send_request>();
    shared_ptr<monero_destination> destination = make_shared<monero_destination>();
    send_request->destinations.push_back(destination);
    if (!address.empty()) destination->address = address;
    destination->amount = amount;
    if (!payment_id.empty()) send_request->payment_id = payment_id;
    if (!note.empty()) send_request->note = note;
    if (!recipient_name.empty()) send_request->recipient_name = recipient_name;
    if (!unknown_parameters.empty()) MWARNING("WARNING in monero_wallet::parse_payment_uri: URI contains unknown parameters which are discarded"); // TODO: return unknown parameters?
    return send_request;
  }

  void monero_wallet::set_attribute(const string& key, const string& val) {
    w2->set_attribute(key, val);
  }

  string monero_wallet::get_attribute(const string& key) const {
    return w2->get_attribute(key);
  }

  void monero_wallet::start_mining(boost::optional<uint64_t> num_threads, boost::optional<bool> background_mining, boost::optional<bool> ignore_battery) {
    MTRACE("start_mining()");

    // only mine on trusted daemon
    if (!w2->is_trusted_daemon()) throw runtime_error("This command requires a trusted daemon.");

    // set defaults
    if (num_threads == boost::none || num_threads.get() == 0) num_threads = 1;  // TODO: how to autodetect optimal number of threads which daemon supports?
    if (background_mining == boost::none) background_mining = false;
    if (ignore_battery == boost::none) ignore_battery = false;

    // validate num threads
    size_t max_mining_threads_count = (std::max)(tools::get_max_concurrency(), static_cast<unsigned>(2));
    if (num_threads.get() < 1 || max_mining_threads_count < num_threads.get()) {
      throw runtime_error("The specified number of threads is inappropriate.");
    }

    // start mining on daemon
    cryptonote::COMMAND_RPC_START_MINING::request daemon_req = AUTO_VAL_INIT(daemon_req);
    daemon_req.miner_address = w2->get_account().get_public_address_str(w2->nettype());
    daemon_req.threads_count = num_threads.get();
    daemon_req.do_background_mining = background_mining.get();
    daemon_req.ignore_battery       = ignore_battery.get();
    cryptonote::COMMAND_RPC_START_MINING::response daemon_res;
    bool r = w2->invoke_http_json("/start_mining", daemon_req, daemon_res);
    if (!r || daemon_res.status != CORE_RPC_STATUS_OK) {
      throw runtime_error("Couldn't start mining due to unknown error.");
    }
  }

  void monero_wallet::stop_mining() {
    MTRACE("stop_mining()");
    cryptonote::COMMAND_RPC_STOP_MINING::request daemon_req;
    cryptonote::COMMAND_RPC_STOP_MINING::response daemon_res;
    bool r = w2->invoke_http_json("/stop_mining", daemon_req, daemon_res);
    if (!r || daemon_res.status != CORE_RPC_STATUS_OK) {
      throw runtime_error("Couldn't stop mining due to unknown error.");
    }
  }

  void monero_wallet::save() {
    MTRACE("save()");
    w2->store();
  }

  void monero_wallet::move_to(string path, string password) {
    MTRACE("move_to(" << path << ", " << password << ")");
    w2->store_to(path, password);
  }

  void monero_wallet::close() {
    MTRACE("close()");
    syncing_enabled = false;
    syncing_thread_done = true;
    sync_cv.notify_one();
    syncing_thread.join();
    w2->stop();
    w2->deinit();
  }

  // ------------------------------- PRIVATE HELPERS ----------------------------

  void monero_wallet::init_common() {
    MTRACE("monero_wallet.cpp init_common()");
    w2_listener = unique_ptr<wallet2_listener>(new wallet2_listener(*this, *w2));
    if (get_daemon_connection() == nullptr) is_connected = false;
    is_synced = false;
    rescan_on_sync = false;
    syncing_enabled = false;
    syncing_thread_done = false;
    syncing_interval = DEFAULT_SYNC_INTERVAL_MILLIS;

    // start auto sync loop
    syncing_thread = boost::thread([this]() {
      this->sync_thread_func();
    });
  }

  void monero_wallet::sync_thread_func() {
    MTRACE("sync_thread_func()");
    while (true) {
      boost::mutex::scoped_lock lock(syncing_mutex);
      if (syncing_thread_done) break;
      if (syncing_enabled) {
        boost::posix_time::milliseconds wait_for_ms(syncing_interval.load());
        sync_cv.timed_wait(lock, wait_for_ms);
      } else {
        sync_cv.wait(lock);
      }
      if (syncing_enabled) {
        lock_and_sync();
      }
    }
  }

  monero_sync_result monero_wallet::lock_and_sync(boost::optional<uint64_t> start_height, boost::optional<monero_sync_listener&> listener) {
    bool rescan = rescan_on_sync.exchange(false);
    boost::lock_guard<boost::mutex> guarg(sync_mutex); // synchronize sync() and syncAsync()
    monero_sync_result result;
    result.num_blocks_fetched = 0;
    result.received_money = false;
    do {
      // skip if daemon is not connected or synced
      if (is_connected && get_is_daemon_synced()) {

        // rescan blockchain if requested
        if (rescan) w2->rescan_blockchain(false);

        // sync wallet
        result = sync_aux(start_height, listener);

        // find and save rings
        w2->find_and_save_rings(false);
      }
    } while (!rescan && (rescan = rescan_on_sync.exchange(false))); // repeat if not rescanned and rescan was requested
    return result;
  }

  monero_sync_result monero_wallet::sync_aux(boost::optional<uint64_t> start_height, boost::optional<monero_sync_listener&> listener) {
    MTRACE("sync_aux()");

    // determine sync start height
    uint64_t sync_start_height = start_height == boost::none ? max(get_height(), get_restore_height()) : *start_height;
    if (sync_start_height < get_restore_height()) set_restore_height(sync_start_height); // TODO monero core: start height processed > requested start height unless restore height manually set

    // sync wallet and return result
    w2_listener->on_sync_start(sync_start_height, listener);
    monero_sync_result result;
    w2->refresh(w2->is_trusted_daemon(), sync_start_height, result.num_blocks_fetched, result.received_money, true);
    if (!is_synced) is_synced = true;
    w2_listener->on_sync_end();
    return result;
  }

  // private helper to initialize subaddresses using transfer details
  vector<monero_subaddress> monero_wallet::get_subaddresses_aux(const uint32_t account_idx, const vector<uint32_t>& subaddress_indices, const vector<tools::wallet2::transfer_details>& transfers) const {
    vector<monero_subaddress> subaddresses;

    // get balances per subaddress as maps
    map<uint32_t, uint64_t> balancePerSubaddress = w2->balance_per_subaddress(account_idx);
    map<uint32_t, std::pair<uint64_t, uint64_t>> unlockedBalancePerSubaddress = w2->unlocked_balance_per_subaddress(account_idx);

    // get all indices if no indices given
    vector<uint32_t> subaddress_indices_req;
    if (subaddress_indices.empty()) {
      for (uint32_t subaddress_idx = 0; subaddress_idx < w2->get_num_subaddresses(account_idx); subaddress_idx++) {
        subaddress_indices_req.push_back(subaddress_idx);
      }
    } else {
      subaddress_indices_req = subaddress_indices;
    }

    // initialize subaddresses at indices
    for (uint32_t subaddressIndicesIdx = 0; subaddressIndicesIdx < subaddress_indices_req.size(); subaddressIndicesIdx++) {
      monero_subaddress subaddress;
      subaddress.account_index = account_idx;
      uint32_t subaddress_idx = subaddress_indices_req.at(subaddressIndicesIdx);
      subaddress.index = subaddress_idx;
      subaddress.address = get_address(account_idx, subaddress_idx);
      subaddress.label = w2->get_subaddress_label({account_idx, subaddress_idx});
      auto iter1 = balancePerSubaddress.find(subaddress_idx);
      subaddress.balance = iter1 == balancePerSubaddress.end() ? 0 : iter1->second;
      auto iter2 = unlockedBalancePerSubaddress.find(subaddress_idx);
      subaddress.unlocked_balance = iter2 == unlockedBalancePerSubaddress.end() ? 0 : iter2->second.first;
      cryptonote::subaddress_index index = {account_idx, subaddress_idx};
      subaddress.num_unspent_outputs = count_if(transfers.begin(), transfers.end(), [&](const tools::wallet2::transfer_details& td) { return !td.m_spent && td.m_subaddr_index == index; });
      subaddress.is_used = find_if(transfers.begin(), transfers.end(), [&](const tools::wallet2::transfer_details& td) { return td.m_subaddr_index == index; }) != transfers.end();
      subaddress.num_blocks_to_unlock = iter1 == balancePerSubaddress.end() ? 0 : iter2->second.second;
      subaddresses.push_back(subaddress);
    }

    return subaddresses;
  }
}
