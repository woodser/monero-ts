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

  shared_ptr<monero_tx_wallet> build_tx_with_incoming_transfer(const tools::wallet2& m_w2, uint64_t height, const crypto::hash &payment_id, const tools::wallet2::payment_details &pd) {

    // construct block
    shared_ptr<monero_block> block = make_shared<monero_block>();
    block->m_height = pd.m_block_height;
    block->m_timestamp = pd.m_timestamp;

    // construct tx
    shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
    tx->m_block = block;
    block->m_txs.push_back(tx);
    tx->m_id = string_tools::pod_to_hex(pd.m_tx_hash);
    tx->m_payment_id = string_tools::pod_to_hex(payment_id);
    if (tx->m_payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->m_payment_id = tx->m_payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->m_payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->m_payment_id = boost::none;  // clear default payment id
    tx->m_unlock_time = pd.m_unlock_time;
    tx->m_fee = pd.m_fee;
    tx->m_note = m_w2.get_tx_note(pd.m_tx_hash);
    if (tx->m_note->empty()) tx->m_note = boost::none; // clear empty note
    tx->m_is_miner_tx = pd.m_coinbase ? true : false;
    tx->m_is_confirmed = true;
    tx->m_is_failed = false;
    tx->m_is_relayed = true;
    tx->m_in_tx_pool = false;
    tx->m_do_not_relay = false;
    tx->m_is_double_spend_seen = false;

    // compute m_num_confirmations TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    // TODO: factor out this duplicate code with build_tx_with_outgoing_transfer()
    if (*block->m_height >= height || (*block->m_height == 0 && !*tx->m_in_tx_pool)) tx->m_num_confirmations = 0;
    else tx->m_num_confirmations = height - *block->m_height;

    // construct transfer
    shared_ptr<monero_incoming_transfer> incoming_transfer = make_shared<monero_incoming_transfer>();
    incoming_transfer->m_tx = tx;
    tx->m_incoming_transfers.push_back(incoming_transfer);
    incoming_transfer->m_amount = pd.m_amount;
    incoming_transfer->m_account_index = pd.m_subaddr_index.major;
    incoming_transfer->m_subaddress_index = pd.m_subaddr_index.minor;
    incoming_transfer->m_address = m_w2.get_subaddress_as_str(pd.m_subaddr_index);

    // compute m_num_suggested_confirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 `set_confirmations` but it should be encapsulated in wallet2
    // TODO: factor out this duplicate code with build_tx_with_outgoing_transfer()
    uint64_t block_reward = m_w2.get_last_block_reward();
    if (block_reward == 0) incoming_transfer->m_num_suggested_confirmations = 0;
    else incoming_transfer->m_num_suggested_confirmations = (*incoming_transfer->m_amount + block_reward - 1) / block_reward;

    // return pointer to new tx
    return tx;
  }

  shared_ptr<monero_tx_wallet> build_tx_with_outgoing_transfer(const tools::wallet2& m_w2, uint64_t height, const crypto::hash &txid, const tools::wallet2::confirmed_transfer_details &pd) {

    // construct block
    shared_ptr<monero_block> block = make_shared<monero_block>();
    block->m_height = pd.m_block_height;
    block->m_timestamp = pd.m_timestamp;

    // construct tx
    shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
    tx->m_block = block;
    block->m_txs.push_back(tx);
    tx->m_id = string_tools::pod_to_hex(txid);
    tx->m_payment_id = string_tools::pod_to_hex(pd.m_payment_id);
    if (tx->m_payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->m_payment_id = tx->m_payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->m_payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->m_payment_id = boost::none;  // clear default payment id
    tx->m_unlock_time = pd.m_unlock_time;
    tx->m_fee = pd.m_amount_in - pd.m_amount_out;
    tx->m_note = m_w2.get_tx_note(txid);
    if (tx->m_note->empty()) tx->m_note = boost::none; // clear empty note
    tx->m_is_miner_tx = false;
    tx->m_is_confirmed = true;
    tx->m_is_failed = false;
    tx->m_is_relayed = true;
    tx->m_in_tx_pool = false;
    tx->m_do_not_relay = false;
    tx->m_is_double_spend_seen = false;

    // compute m_num_confirmations TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    if (*block->m_height >= height || (*block->m_height == 0 && !*tx->m_in_tx_pool)) tx->m_num_confirmations = 0;
    else tx->m_num_confirmations = height - *block->m_height;

    // construct transfer
    shared_ptr<monero_outgoing_transfer> outgoing_transfer = make_shared<monero_outgoing_transfer>();
    outgoing_transfer->m_tx = tx;
    tx->m_outgoing_transfer = outgoing_transfer;
    uint64_t change = pd.m_change == (uint64_t)-1 ? 0 : pd.m_change; // change may not be known
    outgoing_transfer->m_amount = pd.m_amount_in - change - *tx->m_fee;
    outgoing_transfer->m_account_index = pd.m_subaddr_account;
    vector<uint32_t> subaddress_indices;
    vector<string> addresses;
    for (uint32_t i: pd.m_subaddr_indices) {
      subaddress_indices.push_back(i);
      addresses.push_back(m_w2.get_subaddress_as_str({pd.m_subaddr_account, i}));
    }
    outgoing_transfer->m_subaddress_indices = subaddress_indices;
    outgoing_transfer->m_addresses = addresses;

    // initialize destinations
    for (const auto &d: pd.m_dests) {
      shared_ptr<monero_destination> destination = make_shared<monero_destination>();
      destination->m_amount = d.amount;
      destination->m_address = d.original.empty() ? cryptonote::get_account_address_as_str(m_w2.nettype(), d.is_subaddress, d.addr) : d.original;
      outgoing_transfer->m_destinations.push_back(destination);
    }

    // replace transfer amount with destination sum
    // TODO monero core: confirmed tx from/to same account has amount 0 but cached transfer destinations
    if (*outgoing_transfer->m_amount == 0 && !outgoing_transfer->m_destinations.empty()) {
      uint64_t amount = 0;
      for (const shared_ptr<monero_destination>& destination : outgoing_transfer->m_destinations) amount += *destination->m_amount;
      outgoing_transfer->m_amount = amount;
    }

    // compute m_num_suggested_confirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    uint64_t block_reward = m_w2.get_last_block_reward();
    if (block_reward == 0) outgoing_transfer->m_num_suggested_confirmations = 0;
    else outgoing_transfer->m_num_suggested_confirmations = (*outgoing_transfer->m_amount + block_reward - 1) / block_reward;

    // return pointer to new tx
    return tx;
  }

  shared_ptr<monero_tx_wallet> build_tx_with_incoming_transfer_unconfirmed(const tools::wallet2& m_w2, const crypto::hash &payment_id, const tools::wallet2::pool_payment_details &ppd) {

    // construct tx
    const tools::wallet2::payment_details &pd = ppd.m_pd;
    shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
    tx->m_id = string_tools::pod_to_hex(pd.m_tx_hash);
    tx->m_payment_id = string_tools::pod_to_hex(payment_id);
    if (tx->m_payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->m_payment_id = tx->m_payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->m_payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->m_payment_id = boost::none;  // clear default payment id
    tx->m_unlock_time = pd.m_unlock_time;
    tx->m_fee = pd.m_fee;
    tx->m_note = m_w2.get_tx_note(pd.m_tx_hash);
    if (tx->m_note->empty()) tx->m_note = boost::none; // clear empty note
    tx->m_is_miner_tx = false;
    tx->m_is_confirmed = false;
    tx->m_is_failed = false;
    tx->m_is_relayed = true;
    tx->m_in_tx_pool = true;
    tx->m_do_not_relay = false;
    tx->m_is_double_spend_seen = ppd.m_double_spend_seen;
    tx->m_num_confirmations = 0;

    // construct transfer
    shared_ptr<monero_incoming_transfer> incoming_transfer = make_shared<monero_incoming_transfer>();
    incoming_transfer->m_tx = tx;
    tx->m_incoming_transfers.push_back(incoming_transfer);
    incoming_transfer->m_amount = pd.m_amount;
    incoming_transfer->m_account_index = pd.m_subaddr_index.major;
    incoming_transfer->m_subaddress_index = pd.m_subaddr_index.minor;
    incoming_transfer->m_address = m_w2.get_subaddress_as_str(pd.m_subaddr_index);

    // compute m_num_suggested_confirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    uint64_t block_reward = m_w2.get_last_block_reward();
    if (block_reward == 0) incoming_transfer->m_num_suggested_confirmations = 0;
    else incoming_transfer->m_num_suggested_confirmations = (*incoming_transfer->m_amount + block_reward - 1) / block_reward;

    // return pointer to new tx
    return tx;
  }

  shared_ptr<monero_tx_wallet> build_tx_with_outgoing_transfer_unconfirmed(const tools::wallet2& m_w2, const crypto::hash &txid, const tools::wallet2::unconfirmed_transfer_details &pd) {

    // construct tx
    shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
    tx->m_is_failed = pd.m_state == tools::wallet2::unconfirmed_transfer_details::failed;
    tx->m_id = string_tools::pod_to_hex(txid);
    tx->m_payment_id = string_tools::pod_to_hex(pd.m_payment_id);
    if (tx->m_payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->m_payment_id = tx->m_payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->m_payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->m_payment_id = boost::none;  // clear default payment id
    tx->m_unlock_time = pd.m_tx.unlock_time;
    tx->m_fee = pd.m_amount_in - pd.m_amount_out;
    tx->m_note = m_w2.get_tx_note(txid);
    if (tx->m_note->empty()) tx->m_note = boost::none; // clear empty note
    tx->m_is_miner_tx = false;
    tx->m_is_confirmed = false;
    tx->m_is_relayed = !tx->m_is_failed.get();
    tx->m_in_tx_pool = !tx->m_is_failed.get();
    tx->m_do_not_relay = false;
    if (!tx->m_is_failed.get() && tx->m_is_relayed.get()) tx->m_is_double_spend_seen = false;  // TODO: test and handle if true
    tx->m_num_confirmations = 0;

    // construct transfer
    shared_ptr<monero_outgoing_transfer> outgoing_transfer = make_shared<monero_outgoing_transfer>();
    outgoing_transfer->m_tx = tx;
    tx->m_outgoing_transfer = outgoing_transfer;
    outgoing_transfer->m_amount = pd.m_amount_in - pd.m_change - tx->m_fee.get();
    outgoing_transfer->m_account_index = pd.m_subaddr_account;
    vector<uint32_t> subaddress_indices;
    vector<string> addresses;
    for (uint32_t i: pd.m_subaddr_indices) {
      subaddress_indices.push_back(i);
      addresses.push_back(m_w2.get_subaddress_as_str({pd.m_subaddr_account, i}));
    }
    outgoing_transfer->m_subaddress_indices = subaddress_indices;
    outgoing_transfer->m_addresses = addresses;

    // initialize destinations
    for (const auto &d: pd.m_dests) {
      shared_ptr<monero_destination> destination = make_shared<monero_destination>();
      destination->m_amount = d.amount;
      destination->m_address = d.original.empty() ? cryptonote::get_account_address_as_str(m_w2.nettype(), d.is_subaddress, d.addr) : d.original;
      outgoing_transfer->m_destinations.push_back(destination);
    }

    // replace transfer amount with destination sum
    // TODO monero core: confirmed tx from/to same account has amount 0 but cached transfer destinations
    if (*outgoing_transfer->m_amount == 0 && !outgoing_transfer->m_destinations.empty()) {
      uint64_t amount = 0;
      for (const shared_ptr<monero_destination>& destination : outgoing_transfer->m_destinations) amount += *destination->m_amount;
      outgoing_transfer->m_amount = amount;
    }

    // compute num_suggested_confirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    uint64_t block_reward = m_w2.get_last_block_reward();
    if (block_reward == 0) outgoing_transfer->m_num_suggested_confirmations = 0;
    else outgoing_transfer->m_num_suggested_confirmations = (*outgoing_transfer->m_amount + block_reward - 1) / block_reward;

    // return pointer to new tx
    return tx;
  }

  shared_ptr<monero_tx_wallet> build_tx_with_vout(const tools::wallet2& m_w2, const tools::wallet2::transfer_details& td) {

    // construct block
    shared_ptr<monero_block> block = make_shared<monero_block>();
    block->m_height = td.m_block_height;

    // construct tx
    shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
    tx->m_block = block;
    block->m_txs.push_back(tx);
    tx->m_id = epee::string_tools::pod_to_hex(td.m_txid);
    tx->m_is_confirmed = true;
    tx->m_is_failed = false;
    tx->m_is_relayed = true;
    tx->m_in_tx_pool = false;
    tx->m_do_not_relay = false;
    tx->m_is_double_spend_seen = false;

    // construct vout
    shared_ptr<monero_output_wallet> vout = make_shared<monero_output_wallet>();
    vout->m_tx = tx;
    tx->m_vouts.push_back(vout);
    vout->m_amount = td.amount();
    vout->m_index = td.m_global_output_index;
    vout->m_account_index = td.m_subaddr_index.major;
    vout->m_subaddress_index = td.m_subaddr_index.minor;
    vout->m_is_spent = td.m_spent;
    vout->m_is_unlocked = m_w2.is_transfer_unlocked(td);
    vout->m_is_frozen = td.m_frozen;
    if (td.m_key_image_known) {
      vout->m_key_image = make_shared<monero_key_image>();
      vout->m_key_image.get()->m_hex = epee::string_tools::pod_to_hex(td.m_key_image);
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
    if (tx->m_id == boost::none) throw runtime_error("Tx id is not initialized");

    // if tx doesn't exist, add it (unless skipped)
    map<string, shared_ptr<monero_tx_wallet>>::const_iterator tx_iter = tx_map.find(*tx->m_id);
    if (tx_iter == tx_map.end()) {
      if (!skip_if_absent) {
        tx_map[*tx->m_id] = tx;
      } else {
        MWARNING("WARNING: tx does not already exist");
      }
    }

    // otherwise merge with existing tx
    else {
      shared_ptr<monero_tx_wallet>& a_tx = tx_map[*tx->m_id];
      a_tx->merge(a_tx, tx);
    }

    // if confirmed, merge tx's block
    if (tx->get_height() != boost::none) {
      map<uint64_t, shared_ptr<monero_block>>::const_iterator blockIter = block_map.find(tx->get_height().get());
      if (blockIter == block_map.end()) {
        block_map[tx->get_height().get()] = tx->m_block.get();
      } else {
        shared_ptr<monero_block>& a_block = block_map[tx->get_height().get()];
        a_block->merge(a_block, tx->m_block.get());
      }
    }
  }

  /**
   * Returns true iff tx1's height is known to be less than tx2's height for sorting.
   */
  bool tx_height_less_than(const shared_ptr<monero_tx>& tx1, const shared_ptr<monero_tx>& tx2) {
    if (tx1->m_block != boost::none && tx2->m_block != boost::none) return tx1->get_height() < tx2->get_height();
    else if (tx1->m_block == boost::none) return false;
    else return true;
  }

  /**
   * Returns true iff transfer1 is ordered before transfer2 by ascending account and subaddress indices.
   */
  bool incoming_transfer_before(const shared_ptr<monero_incoming_transfer>& transfer1, const shared_ptr<monero_incoming_transfer>& transfer2) {

    // compare by height
    if (tx_height_less_than(transfer1->m_tx, transfer2->m_tx)) return true;

    // compare by account and subaddress index
    if (transfer1->m_account_index.get() < transfer2->m_account_index.get()) return true;
    else if (transfer1->m_account_index.get() == transfer2->m_account_index.get()) return transfer1->m_subaddress_index.get() < transfer2->m_subaddress_index.get();
    else return false;
  }

  /**
   * Returns true iff wallet vout1 is ordered before vout2 by ascending account and subaddress indices then index.
   */
  bool vout_before(const shared_ptr<monero_output>& o1, const shared_ptr<monero_output>& o2) {
    shared_ptr<monero_output_wallet> ow1 = static_pointer_cast<monero_output_wallet>(o1);
    shared_ptr<monero_output_wallet> ow2 = static_pointer_cast<monero_output_wallet>(o2);

    // compare by height
    if (tx_height_less_than(ow1->m_tx, ow2->m_tx)) return true;

    // compare by account index, subaddress index, and output
    if (ow1->m_account_index.get() < ow2->m_account_index.get()) return true;
    else if (ow1->m_account_index.get() == ow2->m_account_index.get()) {
      if (ow1->m_subaddress_index.get() < ow2->m_subaddress_index.get()) return true;
      if (ow1->m_subaddress_index.get() == ow2->m_subaddress_index.get() && ow1->m_index.get() < ow2->m_index.get()) return true;
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
   * TODO: open patch on Monero core which moves common wallet rpc logic (e.g. on_transfer, on_transfer_split) to m_w2.
   *
   * Until then, option (1) is used because it allows Monero Core binaries to be used without modification, it's easy, and
   * anything other than (4) is temporary.
   */
  //------------------------------------------------------------------------------------------------------------------------------
  bool validate_transfer(wallet2* m_w2, const std::list<wallet_rpc::transfer_destination>& destinations, const std::string& payment_id, std::vector<cryptonote::tx_destination_entry>& dsts, std::vector<uint8_t>& extra, bool at_least_one_destination, epee::json_rpc::error& er)
  {
    crypto::hash8 integrated_payment_id = crypto::null_hash8;
    std::string extra_nonce;
    for (auto it = destinations.begin(); it != destinations.end(); it++)
    {
      cryptonote::address_parse_info info;
      cryptonote::tx_destination_entry de;
      er.message = "";
      if(!get_account_address_from_str_or_url(info, m_w2->nettype(), it->address,
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
  bool fill_response(wallet2* m_w2, std::vector<tools::wallet2::pending_tx> &ptx_vector,
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

    if (m_w2->multisig())
    {
      multisig_txset = epee::string_tools::buff_to_hex_nodelimer(m_w2->save_multisig_tx(ptx_vector));
      if (multisig_txset.empty())
      {
        er.code = WALLET_RPC_ERROR_CODE_UNKNOWN_ERROR;
        er.message = "Failed to save multisig tx set after creation";
        return false;
      }
    }
    else
    {
      if (m_w2->watch_only()){
        unsigned_txset = epee::string_tools::buff_to_hex_nodelimer(m_w2->dump_tx_to_str(ptx_vector));
        if (unsigned_txset.empty())
        {
          er.code = WALLET_RPC_ERROR_CODE_UNKNOWN_ERROR;
          er.message = "Failed to save unsigned tx set after creation";
          return false;
        }
      }
      else if (!do_not_relay)
        m_w2->commit_tx(ptx_vector);

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
    wallet2_listener(monero_wallet& wallet, tools::wallet2& m_w2) : m_wallet(wallet), m_w2(m_w2) {
      this->m_listener = boost::none;
      this->m_sync_start_height = boost::none;
      this->m_sync_end_height = boost::none;
      this->m_sync_listener = boost::none;
    }

    ~wallet2_listener() {
      MTRACE("~wallet2_listener()");
    }

    void set_wallet_listener(boost::optional<monero_wallet_listener&> listener) {
      this->m_listener = listener;
      update_listening();
    }

    void on_sync_start(uint64_t start_height, boost::optional<monero_sync_listener&> sync_listener) {
      if (m_sync_start_height != boost::none || m_sync_end_height != boost::none) throw runtime_error("Sync start or end height should not already be allocated, is previous sync in progress?");
      m_sync_start_height = start_height;
      m_sync_end_height = m_wallet.get_daemon_height();
      this->m_sync_listener = sync_listener;
      update_listening();
    }

    void on_sync_end() {
      m_sync_start_height = boost::none;
      m_sync_end_height = boost::none;
      m_sync_listener = boost::none;
      update_listening();
    }

    virtual void on_new_block(uint64_t height, const cryptonote::block& cn_block) {

      // notify listener of block
      if (m_listener != boost::none) m_listener->on_new_block(height);

      // notify listeners of sync progress
      if (m_sync_start_height != boost::none && height >= *m_sync_start_height) {
        if (height >= *m_sync_end_height) m_sync_end_height = height + 1;	// increase end height if necessary
        double percent_done = (double) (height - *m_sync_start_height + 1) / (double) (*m_sync_end_height - *m_sync_start_height);
        string message = string("Synchronizing");
        if (m_listener != boost::none) m_listener.get().on_sync_progress(height, *m_sync_start_height, *m_sync_end_height, percent_done, message);
        if (m_sync_listener != boost::none) m_sync_listener.get().on_sync_progress(height, *m_sync_start_height, *m_sync_end_height, percent_done, message);
      }
    }

    virtual void on_money_received(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& cn_tx, uint64_t amount, const cryptonote::subaddress_index& subaddr_index, uint64_t unlock_time) {
      MTRACE("wallet2_listener::on_money_received()");
      if (m_listener == boost::none) return;

      // create native library tx
      shared_ptr<monero_block> block = make_shared<monero_block>();
      block->m_height = height;
      shared_ptr<monero_tx_wallet> tx = static_pointer_cast<monero_tx_wallet>(monero_utils::cn_tx_to_tx(cn_tx, true));
      block->m_txs.push_back(tx);
      tx->m_block = block;
      tx->m_id = epee::string_tools::pod_to_hex(txid);
      tx->m_unlock_time = unlock_time;
      shared_ptr<monero_output_wallet> output = make_shared<monero_output_wallet>();
      tx->m_vouts.push_back(output);
      output->m_tx = tx;
      output->m_amount = amount;
      output->m_account_index = subaddr_index.major;
      output->m_subaddress_index = subaddr_index.minor;

      // notify listener of output
      m_listener->on_output_received(*output);
    }

    virtual void on_money_spent(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& cn_tx_in, uint64_t amount, const cryptonote::transaction& cn_tx_out, const cryptonote::subaddress_index& subaddr_index) {
      MTRACE("wallet2_listener::on_money_spent()");
      if (&cn_tx_in != &cn_tx_out) throw runtime_error("on_money_spent() in tx is different than out tx");

      // create native library tx
      shared_ptr<monero_block> block = make_shared<monero_block>();
      block->m_height = height;
      shared_ptr<monero_tx_wallet> tx = static_pointer_cast<monero_tx_wallet>(monero_utils::cn_tx_to_tx(cn_tx_in, true));
      block->m_txs.push_back(tx);
      tx->m_block = block;
      tx->m_id = epee::string_tools::pod_to_hex(txid);
      shared_ptr<monero_output_wallet> output = make_shared<monero_output_wallet>();
      tx->m_vins.push_back(output);
      output->m_tx = tx;
      output->m_amount = amount;
      output->m_account_index = subaddr_index.major;
      output->m_subaddress_index = subaddr_index.minor;

      // notify listener of output
      m_listener->on_output_spent(*output);

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
    monero_wallet& m_wallet;  // wallet to provide context for notifications
    tools::wallet2& m_w2;     // internal wallet implementation to listen to
    boost::optional<monero_wallet_listener&> m_listener; // target listener to invoke with notifications
    boost::optional<monero_sync_listener&> m_sync_listener;
    boost::optional<uint64_t> m_sync_start_height;
    boost::optional<uint64_t> m_sync_end_height;

    void update_listening() {
      m_w2.callback(m_listener == boost::none && m_sync_listener == boost::none ? nullptr : this);
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
    wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    wallet->m_w2->load(path, password);
    wallet->m_w2->init("");
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
    wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    wallet->set_daemon_connection(daemon_connection);
    wallet->m_w2->set_seed_language(language);
    crypto::secret_key secret_key;
    wallet->m_w2->generate(path, password, secret_key, false, false);
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
    wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    wallet->set_daemon_connection(daemon_connection);
    wallet->m_w2->set_seed_language(language);
    wallet->m_w2->generate(path, password, recoveryKey, true, false);
    wallet->m_w2->set_refresh_from_block_height(restore_height);
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
    wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    if (has_spend_key && has_view_key) wallet->m_w2->generate(path, password, info.address, spend_key_sk, view_key_sk);
    if (!has_spend_key && has_view_key) wallet->m_w2->generate(path, password, info.address, view_key_sk);
    if (has_spend_key && !has_view_key) wallet->m_w2->generate(path, password, spend_key_sk, true, false);
    wallet->set_daemon_connection(daemon_connection);
    wallet->m_w2->set_refresh_from_block_height(restore_height);
    wallet->m_w2->set_seed_language(language);
    wallet->init_common();
    return wallet;
  }

  monero_wallet::~monero_wallet() {
    MTRACE("~monero_wallet()");
    close();
  }

  // ----------------------------- WALLET METHODS -----------------------------

  uint64_t monero_wallet::get_height() const {
    return m_w2->get_blockchain_current_height();
  }

  uint64_t monero_wallet::get_restore_height() const {
    return m_w2->get_refresh_from_block_height();
  }

  void monero_wallet::set_restore_height(uint64_t restore_height) {
    m_w2->set_refresh_from_block_height(restore_height);
  }

  uint64_t monero_wallet::get_daemon_height() const {
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    std::string err;
    uint64_t result = m_w2->get_daemon_blockchain_height(err);
    if (!err.empty()) throw runtime_error(err);
    return result;
  }

  uint64_t monero_wallet::get_daemon_max_peer_height() const {
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    std::string err;
    uint64_t result = m_w2->get_daemon_blockchain_target_height(err);
    if (!err.empty()) throw runtime_error(err);
    if (result == 0) result = get_daemon_height();  // TODO monero core: target height can be 0 when daemon is synced.  Use blockchain height instead
    return result;
  }

  void monero_wallet::set_daemon_connection(const string& uri, const string& username, const string& password) {
    MTRACE("set_daemon_connection(" << uri << ", " << username << ", " << password << ")");

    // prepare uri, login, and is_trusted for wallet2
    boost::optional<epee::net_utils::http::login> login{};
    login.emplace(username, password);
    bool is_trusted = false;
    try { is_trusted = tools::is_local_address(uri); }	// wallet is trusted iff local
    catch (const exception &e) { }

    // init wallet2 and set daemon connection
    if (!m_w2->init(uri, login)) throw runtime_error("Failed to initialize wallet with daemon connection");
    is_connected(); // update m_is_connected cache // TODO: better naming?
  }

  void monero_wallet::set_daemon_connection(const monero_rpc_connection& connection) {
    set_daemon_connection(connection.m_uri, connection.m_username == boost::none ? "" : connection.m_username.get(), connection.m_password == boost::none ? "" : connection.m_password.get());
  }

  shared_ptr<monero_rpc_connection> monero_wallet::get_daemon_connection() const {
    MTRACE("monero_wallet::get_daemon_connection()");
    if (m_w2->get_daemon_address().empty()) return nullptr;
    shared_ptr<monero_rpc_connection> connection = make_shared<monero_rpc_connection>();
    if (!m_w2->get_daemon_address().empty()) connection->m_uri = m_w2->get_daemon_address();
    if (m_w2->get_daemon_login()) {
      if (!m_w2->get_daemon_login()->username.empty()) connection->m_username = m_w2->get_daemon_login()->username;
      epee::wipeable_string wipeablePassword = m_w2->get_daemon_login()->password;
      string password = string(wipeablePassword.data(), wipeablePassword.size());
      if (!password.empty()) connection->m_password = password;
    }
    return connection;
  }

  // TODO: could return Wallet::ConnectionStatus_Disconnected, Wallet::ConnectionStatus_WrongVersion, Wallet::ConnectionStatus_Connected like wallet.cpp::connected()
  bool monero_wallet::is_connected() const {
    uint32_t version = 0;
    m_is_connected = m_w2->check_connection(&version, NULL, DEFAULT_CONNECTION_TIMEOUT_MILLIS); // TODO: should this be updated elsewhere?
    if (!m_is_connected) return false;
    if (!m_w2->light_wallet() && (version >> 16) != CORE_RPC_VERSION_MAJOR) m_is_connected = false;  // wrong network type
    return m_is_connected;
  }

  bool monero_wallet::is_daemon_synced() const {
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    uint64_t daemonHeight = get_daemon_height();
    return daemonHeight >= get_daemon_max_peer_height() && daemonHeight > 1;
  }

  bool monero_wallet::is_synced() const {
    return m_is_synced;
  }

  string monero_wallet::get_path() const {
    return m_w2->path();
  }

  monero_network_type monero_wallet::get_network_type() const {
    return static_cast<monero_network_type>(m_w2->nettype());
  }

  string monero_wallet::get_language() const {
    return m_w2->get_seed_language();
  }

  vector<string> monero_wallet::get_languages() const {
    vector<string> languages;
    crypto::ElectrumWords::get_language_list(languages, true);
    return languages;
  }

  // get primary address (default impl?)

  string monero_wallet::get_address(uint32_t account_idx, uint32_t subaddress_idx) const {
    return m_w2->get_subaddress_as_str({account_idx, subaddress_idx});
  }

  monero_subaddress monero_wallet::get_address_index(const string& address) const {
    MTRACE("get_address_index(" << address << ")");

    // validate address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, m_w2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // get index of address in wallet
    auto index = m_w2->get_subaddress_index(info.address);
    if (!index) throw runtime_error("Address doesn't belong to the wallet");

    // return indices in subaddress
    monero_subaddress subaddress;
    cryptonote::subaddress_index cn_index = *index;
    subaddress.m_account_index = cn_index.major;
    subaddress.m_index = cn_index.minor;
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
      return decode_integrated_address(m_w2->get_integrated_address_as_str(paymen_id_h8));
    } else {

      // validate standard address
      cryptonote::address_parse_info info;
      if (!cryptonote::get_account_address_from_str(info, m_w2->nettype(), standard_address)) throw runtime_error("Invalid address: " + standard_address);
      if (info.is_subaddress) throw runtime_error("Subaddress shouldn't be used");
      if (info.has_payment_id) throw runtime_error("Already integrated address");
      if (payment_id.empty()) throw runtime_error("Payment ID shouldn't be left unspecified");

      // create integrated address from given standard address
      return decode_integrated_address(cryptonote::get_account_integrated_address_as_str(m_w2->nettype(), info.address, paymen_id_h8));
    }
  }

  monero_integrated_address monero_wallet::decode_integrated_address(const string& integrated_address) const {
    MTRACE("decode_integrated_address(" << integrated_address << ")");

    // validate integrated address
    cryptonote::address_parse_info info;
    if (!cryptonote::get_account_address_from_str(info, m_w2->nettype(), integrated_address)) throw runtime_error("Invalid integrated address: " + integrated_address);
    if (!info.has_payment_id) throw runtime_error("Address is not an integrated address");

    // initialize and return result
    monero_integrated_address result;
    result.m_standard_address = cryptonote::get_account_address_as_str(m_w2->nettype(), info.is_subaddress, info.address);
    result.m_payment_id = epee::string_tools::pod_to_hex(info.payment_id);
    result.m_integrated_address = integrated_address;
    return result;
  }

  string monero_wallet::get_mnemonic() const {
    epee::wipeable_string wipeablePassword;
    m_w2->get_seed(wipeablePassword);
    return string(wipeablePassword.data(), wipeablePassword.size());
  }

  string monero_wallet::get_public_view_key() const {
    MTRACE("get_private_view_key()");
    return epee::string_tools::pod_to_hex(m_w2->get_account().get_keys().m_account_address.m_view_public_key);
  }

  string monero_wallet::get_private_view_key() const {
    MTRACE("get_private_view_key()");
    return epee::string_tools::pod_to_hex(m_w2->get_account().get_keys().m_view_secret_key);
  }

  string monero_wallet::get_public_spend_key() const {
    MTRACE("get_private_spend_key()");
    return epee::string_tools::pod_to_hex(m_w2->get_account().get_keys().m_account_address.m_spend_public_key);
  }

  string monero_wallet::get_private_spend_key() const {
    MTRACE("get_private_spend_key()");
    return epee::string_tools::pod_to_hex(m_w2->get_account().get_keys().m_spend_secret_key);
  }

  string monero_wallet::get_primary_address() const {
    MTRACE("get_primary_address()");
    return get_address(0, 0);
  }

  void monero_wallet::set_listener(const boost::optional<monero_wallet_listener&> listener) {
    MTRACE("set_listener()");
    m_w2_listener->set_wallet_listener(listener);
  }

  monero_sync_result monero_wallet::sync() {
    MTRACE("sync()");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    return lock_and_sync();
  }

  monero_sync_result monero_wallet::sync(monero_sync_listener& listener) {
    MTRACE("sync(listener)");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    return lock_and_sync(boost::none, listener);
  }

  monero_sync_result monero_wallet::sync(uint64_t start_height) {
    MTRACE("sync(" << start_height << ")");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    return lock_and_sync(start_height);
  }

  monero_sync_result monero_wallet::sync(uint64_t start_height, monero_sync_listener& listener) {
    MTRACE("sync(" << start_height << ", listener)");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    return lock_and_sync(start_height, listener);
  }

  /**
   * Start automatic syncing as its own thread.
   */
  void monero_wallet::start_syncing() {
    if (!m_syncing_enabled) {
      m_syncing_enabled = true;
      m_sync_cv.notify_one();
    }
  }

  /**
   * Stop automatic syncing as its own thread.
   */
  void monero_wallet::stop_syncing() {
    if (!m_syncing_thread_done) {
      m_syncing_enabled = false;
    }
  }

  // TODO: support arguments bool hard, bool refresh = true, bool keep_key_images = false
  void monero_wallet::rescan_blockchain() {
    MTRACE("rescan_blockchain()");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    m_rescan_on_sync = true;
    lock_and_sync();
  }

  // isMultisigImportNeeded

  uint64_t monero_wallet::get_balance() const {
    return m_w2->balance_all();
  }

  uint64_t monero_wallet::get_balance(uint32_t account_idx) const {
    return m_w2->balance(account_idx);
  }

  uint64_t monero_wallet::get_balance(uint32_t account_idx, uint32_t subaddress_idx) const {
    map<uint32_t, uint64_t> balancePerSubaddress = m_w2->balance_per_subaddress(account_idx);
    auto iter = balancePerSubaddress.find(subaddress_idx);
    return iter == balancePerSubaddress.end() ? 0 : iter->second;
  }

  uint64_t monero_wallet::get_unlocked_balance() const {
    return m_w2->unlocked_balance_all();
  }

  uint64_t monero_wallet::get_unlocked_balance(uint32_t account_idx) const {
    return m_w2->unlocked_balance(account_idx);
  }

  uint64_t monero_wallet::get_unlocked_balance(uint32_t account_idx, uint32_t subaddress_idx) const {
    map<uint32_t, std::pair<uint64_t, uint64_t>> unlockedBalancePerSubaddress = m_w2->unlocked_balance_per_subaddress(account_idx);
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
    if (include_subaddresses) m_w2->get_transfers(transfers);

    // build accounts
    vector<monero_account> accounts;
    for (uint32_t account_idx = 0; account_idx < m_w2->get_num_subaddress_accounts(); account_idx++) {
      monero_account account;
      account.m_index = account_idx;
      account.m_primary_address = get_address(account_idx, 0);
      account.m_balance = m_w2->balance(account_idx);
      account.m_unlocked_balance = m_w2->unlocked_balance(account_idx);
      if (include_subaddresses) account.m_subaddresses = get_subaddresses_aux(account_idx, vector<uint32_t>(), transfers);
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
    if (include_subaddresses) m_w2->get_transfers(transfers);

    // build and return account
    monero_account account;
    account.m_index = account_idx;
    account.m_primary_address = get_address(account_idx, 0);
    account.m_balance = m_w2->balance(account_idx);
    account.m_unlocked_balance = m_w2->unlocked_balance(account_idx);
    if (include_subaddresses) account.m_subaddresses = get_subaddresses_aux(account_idx, vector<uint32_t>(), transfers);
    return account;
  }

  monero_account monero_wallet::create_account(const string& label) {
    MTRACE("create_account(" << label << ")");

    // create account
    m_w2->add_subaddress_account(label);

    // initialize and return result
    monero_account account;
    account.m_index = m_w2->get_num_subaddress_accounts() - 1;
    account.m_primary_address = m_w2->get_subaddress_as_str({account.m_index.get(), 0});
    account.m_balance = 0;
    account.m_unlocked_balance = 0;
    return account;
  }

  vector<monero_subaddress> monero_wallet::get_subaddresses(const uint32_t account_idx) const {
    return get_subaddresses(account_idx, vector<uint32_t>());
  }

  vector<monero_subaddress> monero_wallet::get_subaddresses(const uint32_t account_idx, const vector<uint32_t>& subaddress_indices) const {
    MTRACE("get_subaddresses(" << account_idx << ", ...)");
    MTRACE("Subaddress indices size: " << subaddress_indices.size());

    vector<tools::wallet2::transfer_details> transfers;
    m_w2->get_transfers(transfers);
    return get_subaddresses_aux(account_idx, subaddress_indices, transfers);
  }

  monero_subaddress monero_wallet::getSubaddress(const uint32_t account_idx, const uint32_t subaddress_idx) const {
    throw runtime_error("Not implemented");
  }

  // get_subaddresses

  monero_subaddress monero_wallet::create_subaddress(const uint32_t account_idx, const string& label) {
    MTRACE("create_subaddress(" << account_idx << ", " << label << ")");

    // create subaddress
    m_w2->add_subaddress(account_idx, label);

    // initialize and return result
    monero_subaddress subaddress;
    subaddress.m_account_index = account_idx;
    subaddress.m_index = m_w2->get_num_subaddresses(account_idx) - 1;
    subaddress.m_address = m_w2->get_subaddress_as_str({account_idx, subaddress.m_index.get()});
    subaddress.m_label = label;
    subaddress.m_balance = 0;
    subaddress.m_unlocked_balance = 0;
    subaddress.m_num_unspent_outputs = 0;
    subaddress.m_is_used = false;
    subaddress.m_num_blocks_to_unlock = 0;
    return subaddress;
  }

  vector<shared_ptr<monero_tx_wallet>> monero_wallet::get_txs() const {
    return get_txs(monero_tx_query());
  }

  vector<shared_ptr<monero_tx_wallet>> monero_wallet::get_txs(const monero_tx_query& query) const {
    MTRACE("get_txs(query)");
    
    // copy and normalize tx query
    shared_ptr<monero_tx_query> query_ptr = make_shared<monero_tx_query>(query); // convert to shared pointer for copy
    shared_ptr<monero_tx_query> _query = query_ptr->copy(query_ptr, make_shared<monero_tx_query>()); // deep copy
    if (_query->m_transfer_query == boost::none) _query->m_transfer_query = make_shared<monero_transfer_query>();
    shared_ptr<monero_transfer_query> transfer_query = _query->m_transfer_query.get();

    // print query
    if (_query->m_block != boost::none) MTRACE("Tx query's rooted at [block]: " << _query->m_block.get()->serialize());
    else MTRACE("Tx _query: " << _query->serialize());
    
    // temporarily disable transfer query
    _query->m_transfer_query = boost::none;

    // fetch all transfers that meet tx query
    monero_transfer_query temp_transfer_query;
    temp_transfer_query.m_tx_query = make_shared<monero_tx_query>(*_query);
    vector<shared_ptr<monero_transfer>> transfers = get_transfers(temp_transfer_query);

    // collect unique txs from transfers while retaining order
    vector<shared_ptr<monero_tx_wallet>> txs = vector<shared_ptr<monero_tx_wallet>>();
    unordered_set<shared_ptr<monero_tx_wallet>> txsSet;
    for (const shared_ptr<monero_transfer>& transfer : transfers) {
      if (txsSet.find(transfer->m_tx) == txsSet.end()) {
        txs.push_back(transfer->m_tx);
        txsSet.insert(transfer->m_tx);
      }
    }

    // cache types into maps for merging and lookup
    map<string, shared_ptr<monero_tx_wallet>> tx_map;
    map<uint64_t, shared_ptr<monero_block>> block_map;
    for (const shared_ptr<monero_tx_wallet>& tx : txs) {
      merge_tx(tx, tx_map, block_map, false);
    }

    // fetch and merge outputs if requested
    monero_output_query temp_output_query;
    temp_output_query.m_tx_query = make_shared<monero_tx_query>(*_query);
    if (_query->m_include_outputs != boost::none && *_query->m_include_outputs) {

      // fetch outputs
      vector<shared_ptr<monero_output_wallet>> outputs = get_outputs(temp_output_query);

      // merge output txs one time while retaining order
      unordered_set<shared_ptr<monero_tx_wallet>> output_txs;
      for (const shared_ptr<monero_output_wallet>& output : outputs) {
        shared_ptr<monero_tx_wallet> tx = static_pointer_cast<monero_tx_wallet>(output->m_tx);
        if (output_txs.find(tx) == output_txs.end()) {
          merge_tx(tx, tx_map, block_map, true);
          output_txs.insert(tx);
        }
      }
    }

    // filter txs that don't meet transfer query  // TODO: port this updated version to js
    _query->m_transfer_query = transfer_query;
    vector<shared_ptr<monero_tx_wallet>> queried_txs;
    vector<shared_ptr<monero_tx_wallet>>::iterator tx_iter = txs.begin();
    while (tx_iter != txs.end()) {
      shared_ptr<monero_tx_wallet> tx = *tx_iter;
      if (_query->meets_criteria(tx.get())) {
        queried_txs.push_back(tx);
        tx_iter++;
      } else {
        tx_iter = txs.erase(tx_iter);
        if (tx->m_block != boost::none) tx->m_block.get()->m_txs.erase(std::remove(tx->m_block.get()->m_txs.begin(), tx->m_block.get()->m_txs.end(), tx), tx->m_block.get()->m_txs.end()); // TODO, no way to use tx_iter?
      }
    }
    txs = queried_txs;

    // verify all specified tx ids found
    if (!_query->m_tx_ids.empty()) {
      for (const string& tx_id : _query->m_tx_ids) {
        bool found = false;
        for (const shared_ptr<monero_tx_wallet>& tx : txs) {
          if (tx_id == *tx->m_id) {
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
      if (*tx->m_is_confirmed && tx->m_block == boost::none) return get_txs(*_query);
    }

    // otherwise order txs if tx ids given then return
    if (!_query->m_tx_ids.empty()) {
      vector<shared_ptr<monero_tx_wallet>> ordered_txs;
      for (const string& tx_id : _query->m_tx_ids) {
        map<string, shared_ptr<monero_tx_wallet>>::const_iterator tx_iter = tx_map.find(tx_id);
        ordered_txs.push_back(tx_iter->second);
      }
      txs = ordered_txs;
    }
    return txs;
  }

  vector<shared_ptr<monero_transfer>> monero_wallet::get_transfers(const monero_transfer_query& query) const {
    MTRACE("monero_wallet::get_transfers(query)");

    // LOG query
    if (query.m_tx_query != boost::none) {
      if ((*query.m_tx_query)->m_block == boost::none) MTRACE("Transfer query's tx query rooted at [tx]:" << (*query.m_tx_query)->serialize());
      else MTRACE("Transfer query's tx query rooted at [block]: " << (*(*query.m_tx_query)->m_block)->serialize());
    }

    // copy and normalize query
    shared_ptr<monero_transfer_query> _query;
    if (query.m_tx_query == boost::none) _query = query.copy(make_shared<monero_transfer_query>(query), make_shared<monero_transfer_query>());
    else {
      shared_ptr<monero_tx_query> tx_query = query.m_tx_query.get()->copy(query.m_tx_query.get(), make_shared<monero_tx_query>());
      if (query.m_tx_query.get()->m_transfer_query != boost::none && query.m_tx_query.get()->m_transfer_query.get().get() == &query) {
        _query = tx_query->m_transfer_query.get();
      } else {
        if (query.m_tx_query.get()->m_transfer_query != boost::none) throw new runtime_error("Transfer query's tx query must be a circular reference or null");
        shared_ptr<monero_transfer_query> querySp = make_shared<monero_transfer_query>(query);  // convert query to shared pointer for copy
        _query = querySp->copy(querySp, make_shared<monero_transfer_query>());
        _query->m_tx_query = tx_query;
      }
    }
    if (_query->m_tx_query == boost::none) _query->m_tx_query = make_shared<monero_tx_query>();
    shared_ptr<monero_tx_query> tx_query = _query->m_tx_query.get();
    tx_query->m_transfer_query = boost::none; // break circular link for meets_criteria()

    // build parameters for m_w2->get_payments()
    uint64_t min_height = tx_query->m_min_height == boost::none ? 0 : *tx_query->m_min_height;
    uint64_t max_height = tx_query->m_max_height == boost::none ? CRYPTONOTE_MAX_BLOCK_NUMBER : min((uint64_t) CRYPTONOTE_MAX_BLOCK_NUMBER, *tx_query->m_max_height);
    if (min_height > 0) min_height--; // TODO monero core: wallet2::get_payments() m_min_height is exclusive, so manually offset to match intended range (issues 5751, #5598)
    boost::optional<uint32_t> account_index = boost::none;
    if (_query->m_account_index != boost::none) account_index = *_query->m_account_index;
    std::set<uint32_t> subaddress_indices;
    for (int i = 0; i < _query->m_subaddress_indices.size(); i++) {
      subaddress_indices.insert(_query->m_subaddress_indices[i]);
    }

    // translate from monero_tx_query to in, out, pending, pool, failed terminology used by monero-wallet-rpc
    bool can_be_confirmed = !bool_equals(false, tx_query->m_is_confirmed) && !bool_equals(true, tx_query->m_in_tx_pool) && !bool_equals(true, tx_query->m_is_failed) && !bool_equals(false, tx_query->m_is_relayed);
    bool can_be_in_tx_pool = !bool_equals(true, tx_query->m_is_confirmed) && !bool_equals(false, tx_query->m_in_tx_pool) && !bool_equals(true, tx_query->m_is_failed) && !bool_equals(false, tx_query->m_is_relayed) && tx_query->get_height() == boost::none && tx_query->m_min_height == boost::none;
    bool can_be_incoming = !bool_equals(false, _query->m_is_incoming) && !bool_equals(true, _query->is_outgoing()) && !bool_equals(true, _query->m_has_destinations);
    bool can_be_outgoing = !bool_equals(false, _query->is_outgoing()) && !bool_equals(true, _query->m_is_incoming);
    bool is_in = can_be_incoming && can_be_confirmed;
    bool is_out = can_be_outgoing && can_be_confirmed;
    bool is_pending = can_be_outgoing && can_be_in_tx_pool;
    bool is_pool = can_be_incoming && can_be_in_tx_pool;
    bool is_failed = !bool_equals(false, tx_query->m_is_failed) && !bool_equals(true, tx_query->m_is_confirmed) && !bool_equals(true, tx_query->m_in_tx_pool);

    // cache unique txs and blocks
    uint64_t height = get_height();
    map<string, shared_ptr<monero_tx_wallet>> tx_map;
    map<uint64_t, shared_ptr<monero_block>> block_map;

    // get confirmed incoming transfers
    if (is_in) {
      std::list<std::pair<crypto::hash, tools::wallet2::payment_details>> payments;
      m_w2->get_payments(payments, min_height, max_height, account_index, subaddress_indices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::payment_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
        shared_ptr<monero_tx_wallet> tx = build_tx_with_incoming_transfer(*m_w2, height, i->first, i->second);
        merge_tx(tx, tx_map, block_map, false);
      }
    }

    // get confirmed outgoing transfers
    if (is_out) {
      std::list<std::pair<crypto::hash, tools::wallet2::confirmed_transfer_details>> payments;
      m_w2->get_payments_out(payments, min_height, max_height, account_index, subaddress_indices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::confirmed_transfer_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
        shared_ptr<monero_tx_wallet> tx = build_tx_with_outgoing_transfer(*m_w2, height, i->first, i->second);
        merge_tx(tx, tx_map, block_map, false);
      }
    }

    // get unconfirmed or failed outgoing transfers
    if (is_pending || is_failed) {
      std::list<std::pair<crypto::hash, tools::wallet2::unconfirmed_transfer_details>> upayments;
      m_w2->get_unconfirmed_payments_out(upayments, account_index, subaddress_indices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::unconfirmed_transfer_details>>::const_iterator i = upayments.begin(); i != upayments.end(); ++i) {
        shared_ptr<monero_tx_wallet> tx = build_tx_with_outgoing_transfer_unconfirmed(*m_w2, i->first, i->second);
        if (tx_query->m_is_failed != boost::none && tx_query->m_is_failed.get() != tx->m_is_failed.get()) continue; // skip merging if tx excluded
        merge_tx(tx, tx_map, block_map, false);
      }
    }

    // get unconfirmed incoming transfers
    if (is_pool) {
      m_w2->update_pool_state(); // TODO monero-core: this should be encapsulated in wallet when unconfirmed transfers queryed
      std::list<std::pair<crypto::hash, tools::wallet2::pool_payment_details>> payments;
      m_w2->get_unconfirmed_payments(payments, account_index, subaddress_indices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::pool_payment_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
        shared_ptr<monero_tx_wallet> tx = build_tx_with_incoming_transfer_unconfirmed(*m_w2, i->first, i->second);
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
      sort(tx->m_incoming_transfers.begin(), tx->m_incoming_transfers.end(), incoming_transfer_before);

      // collect outgoing transfer, erase if excluded TODO: js does not erase excluded data, port to js
      if (tx->m_outgoing_transfer != boost::none && _query->meets_criteria(tx->m_outgoing_transfer.get().get())) transfers.push_back(tx->m_outgoing_transfer.get());
      else tx->m_outgoing_transfer = boost::none;

      // collect incoming transfers, erase if excluded
      vector<shared_ptr<monero_incoming_transfer>>::iterator iter = tx->m_incoming_transfers.begin();
      while (iter != tx->m_incoming_transfers.end()) {
        if (_query->meets_criteria((*iter).get())) {
          transfers.push_back(*iter);
          iter++;
        } else {
          iter = tx->m_incoming_transfers.erase(iter);
        }
      }

      // remove excluded txs from block
      if (tx->m_block != boost::none && tx->m_outgoing_transfer == boost::none && tx->m_incoming_transfers.empty()) {
        tx->m_block.get()->m_txs.erase(std::remove(tx->m_block.get()->m_txs.begin(), tx->m_block.get()->m_txs.end(), tx), tx->m_block.get()->m_txs.end()); // TODO, no way to use const_iterator?
      }
    }
    MTRACE("monero_wallet.cpp get_transfers() returning " << transfers.size() << " transfers");

    return transfers;
  }

  vector<shared_ptr<monero_output_wallet>> monero_wallet::get_outputs(const monero_output_query& query) const {
    MTRACE("monero_wallet::get_outputs(query)");

    // print query
    MTRACE("Output query: " << query.serialize());
    if (query.m_tx_query != boost::none) {
      if ((*query.m_tx_query)->m_block == boost::none) MTRACE("Output query's tx query rooted at [tx]:" << (*query.m_tx_query)->serialize());
      else MTRACE("Output query's tx query rooted at [block]: " << (*(*query.m_tx_query)->m_block)->serialize());
    }

    // copy and normalize query
    shared_ptr<monero_output_query> _query;
    if (query.m_tx_query == boost::none) _query = query.copy(make_shared<monero_output_query>(query), make_shared<monero_output_query>());
    else {
      shared_ptr<monero_tx_query> tx_query = query.m_tx_query.get()->copy(query.m_tx_query.get(), make_shared<monero_tx_query>());
      if (query.m_tx_query.get()->m_output_query != boost::none && query.m_tx_query.get()->m_output_query.get().get() == &query) {
        _query = tx_query->m_output_query.get();
      } else {
        if (query.m_tx_query.get()->m_output_query != boost::none) throw new runtime_error("Output query's tx query must be a circular reference or null");
        shared_ptr<monero_output_query> query_ptr = make_shared<monero_output_query>(query);  // convert query to shared pointer for copy
        _query = query_ptr->copy(query_ptr, make_shared<monero_output_query>());
        _query->m_tx_query = tx_query;
      }
    }
    if (_query->m_tx_query == boost::none) _query->m_tx_query = make_shared<monero_tx_query>();
    shared_ptr<monero_tx_query> tx_query = _query->m_tx_query.get();
    tx_query->m_output_query = boost::none; // break circular link for meets_criteria()

    // get output data from wallet2
    tools::wallet2::transfer_container outputs_w2;
    m_w2->get_transfers(outputs_w2);

    // cache unique txs and blocks
    map<string, shared_ptr<monero_tx_wallet>> tx_map;
    map<uint64_t, shared_ptr<monero_block>> block_map;
    for (const auto& output_w2 : outputs_w2) {
      // TODO: skip tx building if m_w2 output excluded by indices, etc
      shared_ptr<monero_tx_wallet> tx = build_tx_with_vout(*m_w2, output_w2);
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
      sort(tx->m_vouts.begin(), tx->m_vouts.end(), vout_before);

      // collect queried outputs, remove excluded outputs
      vector<shared_ptr<monero_output>>::iterator voutIter = tx->m_vouts.begin();
      while (voutIter != tx->m_vouts.end()) {
        shared_ptr<monero_output_wallet> vout_wallet = static_pointer_cast<monero_output_wallet>(*voutIter);
        if (_query->meets_criteria(vout_wallet.get())) {
          vouts.push_back(vout_wallet);
          voutIter++;
        } else {
          voutIter = tx->m_vouts.erase(voutIter); // remove excluded vouts
        }
      }

      // remove txs without vouts
      if (tx->m_vouts.empty() && tx->m_block != boost::none) tx->m_block.get()->m_txs.erase(std::remove(tx->m_block.get()->m_txs.begin(), tx->m_block.get()->m_txs.end(), tx), tx->m_block.get()->m_txs.end()); // TODO, no way to use const_iterator?
    }
    return vouts;
  }

  string monero_wallet::get_outputs_hex() const {
    return epee::string_tools::buff_to_hex_nodelimer(m_w2->export_outputs_to_str(true));
  }

  int monero_wallet::import_outputs_hex(const string& outputs_hex) {

    // validate and parse hex data
    cryptonote::blobdata blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(outputs_hex, blob)) {
      throw runtime_error("Failed to parse hex.");
    }

    // import hex and return result
    return m_w2->import_outputs_from_str(blob);
  }

  vector<shared_ptr<monero_key_image>> monero_wallet::get_key_images() const {
    MTRACE("monero_wallet::get_key_images()");

    // build key images from wallet2 types
    vector<shared_ptr<monero_key_image>> key_images;
    std::pair<size_t, std::vector<std::pair<crypto::key_image, crypto::signature>>> ski = m_w2->export_key_images(true);
    for (size_t n = 0; n < ski.second.size(); ++n) {
      shared_ptr<monero_key_image> key_image = make_shared<monero_key_image>();
      key_images.push_back(key_image);
      key_image->m_hex = epee::string_tools::pod_to_hex(ski.second[n].first);
      key_image->m_signature = epee::string_tools::pod_to_hex(ski.second[n].second);
    }
    return key_images;
  }

  shared_ptr<monero_key_image_import_result> monero_wallet::import_key_images(const vector<shared_ptr<monero_key_image>>& key_images) {
    MTRACE("monero_wallet::import_key_images()");

    // validate and prepare key images for wallet2
    std::vector<std::pair<crypto::key_image, crypto::signature>> ski;
    ski.resize(key_images.size());
    for (size_t n = 0; n < ski.size(); ++n) {
      if (!epee::string_tools::hex_to_pod(key_images[n]->m_hex.get(), ski[n].first)) {
        throw runtime_error("failed to parse key image");
      }
      if (!epee::string_tools::hex_to_pod(key_images[n]->m_signature.get(), ski[n].second)) {
        throw runtime_error("failed to parse signature");
      }
    }

    // import key images
    uint64_t spent = 0, unspent = 0;
    uint64_t height = m_w2->import_key_images(ski, 0, spent, unspent); // TODO: use offset? refer to wallet_rpc_server::on_import_key_images() req.offset

    // translate results
    shared_ptr<monero_key_image_import_result> result = make_shared<monero_key_image_import_result>();
    result->m_height = height;
    result->m_spent_amount = spent;
    result->m_unspent_amount = unspent;
    return result;
  }

  shared_ptr<monero_tx_wallet> monero_wallet::create_tx(uint32_t account_index, string address, uint64_t amount) {
    throw new runtime_error("create_tx not implemented");
  }

  shared_ptr<monero_tx_wallet> monero_wallet::create_tx(int account_index, string address, uint64_t amount, monero_send_priority priority) {
    throw new runtime_error("create_tx not implemented");
  }

  shared_ptr<monero_tx_wallet> monero_wallet::create_tx(const monero_send_request& request) {
    throw new runtime_error("create_tx not implemented");
  }

  string monero_wallet::relay_tx(const string& tx_metadata) {
    throw new runtime_error("relay_tx not implemented");
  }

  string monero_wallet::relay_tx(const monero_tx_wallet& tx) {
    throw new runtime_error("relay_tx not implemented");
  }

  vector<string> monero_wallet::relay_txs(const vector<string>& tx_metadatas) {
    MTRACE("relay_txs()");

    // relay each metadata as a tx
    vector<string> m_tx_ids;
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
        m_w2->commit_tx(ptx);
      } catch (const std::exception& e) {
        throw runtime_error("Failed to commit tx.");
      }

      // collect resulting id
      m_tx_ids.push_back(epee::string_tools::pod_to_hex(cryptonote::get_transaction_hash(ptx.tx)));
    }

    // return relayed tx ids
    return m_tx_ids;
  }

  vector<string> monero_wallet::relay_txs(const vector<monero_tx_wallet>& txs) {
    throw new runtime_error("relay_txs not implemented");
  }

  shared_ptr<monero_tx_wallet> monero_wallet::send(uint32_t account_index, string address, uint64_t amount) {
    throw new runtime_error("send not implemented");
  }

  shared_ptr<monero_tx_wallet> monero_wallet::send(uint32_t account_index, string address, uint64_t amount, monero_send_priority priority) {
    throw new runtime_error("send not implemented");
  }

  vector<shared_ptr<monero_tx_wallet>> monero_wallet::send_split(const monero_send_request& request) {
    MTRACE("monero_wallet::send_split(request)");
    MTRACE("monero_send_request: " << request.serialize());

    wallet_rpc::COMMAND_RPC_TRANSFER::request req;
    wallet_rpc::COMMAND_RPC_TRANSFER::response res;
    epee::json_rpc::error err;

    // prepare parameters for wallet rpc's validate_transfer()
    string payment_id = request.m_payment_id == boost::none ? string("") : request.m_payment_id.get();
    list<tools::wallet_rpc::transfer_destination> tr_destinations;
    for (const shared_ptr<monero_destination>& destination : request.m_destinations) {
      tools::wallet_rpc::transfer_destination tr_destination;
      tr_destination.amount = destination->m_amount.get();
      tr_destination.address = destination->m_address.get();
      tr_destinations.push_back(tr_destination);
    }

    // validate the requested txs and populate dsts & extra
    std::vector<cryptonote::tx_destination_entry> dsts;
    std::vector<uint8_t> extra;
    if (!validate_transfer(m_w2.get(), tr_destinations, payment_id, dsts, extra, true, err)) {
      throw runtime_error("Need to handle send_split() validate_transfer error");  // TODO
    }

    // prepare parameters for wallet2's create_transactions_2()
    uint64_t m_mixin = m_w2->adjust_mixin(request.m_ring_size == boost::none ? 0 : request.m_ring_size.get() - 1);
    uint32_t priority = m_w2->adjust_priority(request.m_priority == boost::none ? 0 : request.m_priority.get());
    uint64_t m_unlock_time = request.m_unlock_time == boost::none ? 0 : request.m_unlock_time.get();
    if (request.m_account_index == boost::none) throw runtime_error("Must specify the account index to send from");
    uint32_t m_account_index = request.m_account_index.get();
    std::set<uint32_t> m_subaddress_indices;
    for (const uint32_t& subaddress_idx : request.m_subaddress_indices) m_subaddress_indices.insert(subaddress_idx);

    // prepare transactions
    vector<wallet2::pending_tx> ptx_vector = m_w2->create_transactions_2(dsts, m_mixin, m_unlock_time, priority, extra, m_account_index, m_subaddress_indices);
    if (ptx_vector.empty()) throw runtime_error("No transaction created");

    // check if request cannot be fulfilled due to splitting
    if (request.m_can_split != boost::none && request.m_can_split.get() == false && ptx_vector.size() != 1) {
      throw runtime_error("Transaction would be too large.  Try send_split()");
    }

    // config for fill_response()
    bool get_tx_keys = true;
    bool get_tx_hex = true;
    bool get_tx_metadata = true;
    bool m_do_not_relay = request.m_do_not_relay == boost::none ? false : request.m_do_not_relay.get();

    // commit txs (if relaying) and get response using wallet rpc's fill_response()
    list<string> tx_keys;
    list<uint64_t> tx_amounts;
    list<uint64_t> tx_fees;
    string multisig_tx_set;
    string unsigned_tx_set;
    list<string> m_tx_ids;
    list<string> tx_blobs;
    list<string> tx_metadatas;
    if (!fill_response(m_w2.get(), ptx_vector, get_tx_keys, tx_keys, tx_amounts, tx_fees, multisig_tx_set, unsigned_tx_set, m_do_not_relay, m_tx_ids, get_tx_hex, tx_blobs, get_tx_metadata, tx_metadatas, err)) {
      throw runtime_error("need to handle error filling response!");  // TODO
    }

    // build sent txs from results  // TODO: break this into separate utility function
    vector<shared_ptr<monero_tx_wallet>> txs;
    auto tx_ids_iter = m_tx_ids.begin();
    auto tx_keys_iter = tx_keys.begin();
    auto tx_amounts_iter = tx_amounts.begin();
    auto tx_fees_iter = tx_fees.begin();
    auto tx_blobs_iter = tx_blobs.begin();
    auto tx_metadatas_iter = tx_metadatas.begin();
    while (tx_ids_iter != m_tx_ids.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
      txs.push_back(tx);
      tx->m_id = *tx_ids_iter;
      tx->m_key = *tx_keys_iter;
      tx->m_fee = *tx_fees_iter;
      tx->m_full_hex = *tx_blobs_iter;
      tx->m_metadata = *tx_metadatas_iter;
      shared_ptr<monero_outgoing_transfer> out_transfer = make_shared<monero_outgoing_transfer>();
      tx->m_outgoing_transfer = out_transfer;
      out_transfer->m_amount = *tx_amounts_iter;

      // init other known fields
      tx->m_payment_id = request.m_payment_id;
      tx->m_is_confirmed = false;
      tx->m_is_miner_tx = false;
      tx->m_is_failed = false;   // TODO: test and handle if true
      tx->m_do_not_relay = request.m_do_not_relay != boost::none && request.m_do_not_relay.get() == true;
      tx->m_is_relayed = tx->m_do_not_relay.get() != true;
      tx->m_in_tx_pool = !tx->m_do_not_relay.get();
      if (!tx->m_is_failed.get() && tx->m_is_relayed.get()) tx->m_is_double_spend_seen = false;  // TODO: test and handle if true
      tx->m_num_confirmations = 0;
      tx->m_mixin = request.m_mixin;
      tx->m_unlock_time = request.m_unlock_time == boost::none ? 0 : request.m_unlock_time.get();
      if (tx->m_is_relayed.get()) tx->m_last_relayed_timestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      out_transfer->m_account_index = request.m_account_index;
      if (request.m_subaddress_indices.size() == 1) out_transfer->m_subaddress_indices.push_back(request.m_subaddress_indices[0]);  // subaddress index is known iff 1 requested  // TODO: get all known subaddress indices here
      out_transfer->m_destinations = request.m_destinations;

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
    if (request.m_key_image == boost::none || request.m_key_image.get().empty()) throw runtime_error("Must provide key image of output to sweep");
    if (request.m_destinations.size() != 1 || request.m_destinations[0]->m_address == boost::none || request.m_destinations[0]->m_address.get().empty()) throw runtime_error("Must provide exactly one destination to sweep output to");

    // validate the transfer queryed and populate dsts & extra
    string m_payment_id = request.m_payment_id == boost::none ? string("") : request.m_payment_id.get();
    std::vector<cryptonote::tx_destination_entry> dsts;
    std::vector<uint8_t> extra;
    std::list<wallet_rpc::transfer_destination> destination;
    destination.push_back(wallet_rpc::transfer_destination());
    destination.back().amount = 0;
    destination.back().address = request.m_destinations[0]->m_address.get();
    epee::json_rpc::error er;
    if (!validate_transfer(m_w2.get(), destination, m_payment_id, dsts, extra, true, er)) {
      //throw runtime_error(er);  // TODO
      throw runtime_error("Handle validate_transfer error!");
    }

    // validate key image
    crypto::key_image ki;
    if (!epee::string_tools::hex_to_pod(request.m_key_image.get(), ki)) {
      throw runtime_error("failed to parse key image");
    }

    // create transaction
    uint64_t m_mixin = m_w2->adjust_mixin(request.m_ring_size == boost::none ? 0 : request.m_ring_size.get() - 1);
    uint32_t priority = m_w2->adjust_priority(request.m_priority == boost::none ? 0 : request.m_priority.get());
    uint64_t m_unlock_time = request.m_unlock_time == boost::none ? 0 : request.m_unlock_time.get();
    std::vector<wallet2::pending_tx> ptx_vector = m_w2->create_transactions_single(ki, dsts[0].addr, dsts[0].is_subaddress, 1, m_mixin, m_unlock_time, priority, extra);

    // validate created transaction
    if (ptx_vector.empty()) throw runtime_error("No outputs found");
    if (ptx_vector.size() > 1) throw runtime_error("Multiple transactions are created, which is not supposed to happen");
    const wallet2::pending_tx &ptx = ptx_vector[0];
    if (ptx.selected_transfers.size() > 1) throw runtime_error("The transaction uses multiple inputs, which is not supposed to happen");

    // config for fill_response()
    bool get_tx_keys = true;
    bool get_tx_hex = true;
    bool get_tx_metadata = true;
    bool m_do_not_relay = request.m_do_not_relay == boost::none ? false : request.m_do_not_relay.get();

    // commit txs (if relaying) and get response using wallet rpc's fill_response()
    list<string> tx_keys;
    list<uint64_t> tx_amounts;
    list<uint64_t> tx_fees;
    string multisig_tx_set;
    string unsigned_tx_set;
    list<string> m_tx_ids;
    list<string> tx_blobs;
    list<string> tx_metadatas;
    if (!fill_response(m_w2.get(), ptx_vector, get_tx_keys, tx_keys, tx_amounts, tx_fees, multisig_tx_set, unsigned_tx_set, m_do_not_relay, m_tx_ids, get_tx_hex, tx_blobs, get_tx_metadata, tx_metadatas, er)) {
      throw runtime_error("need to handle error filling response!");  // TODO: return err message
    }

    // build sent txs from results  // TODO: use common utility with send_split() to avoid code duplication
    vector<shared_ptr<monero_tx_wallet>> txs;
    auto tx_ids_iter = m_tx_ids.begin();
    auto tx_keys_iter = tx_keys.begin();
    auto tx_amounts_iter = tx_amounts.begin();
    auto tx_fees_iter = tx_fees.begin();
    auto tx_blobs_iter = tx_blobs.begin();
    auto tx_metadatas_iter = tx_metadatas.begin();
    while (tx_ids_iter != m_tx_ids.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
      txs.push_back(tx);
      tx->m_id = *tx_ids_iter;
      tx->m_key = *tx_keys_iter;
      tx->m_fee = *tx_fees_iter;
      tx->m_full_hex = *tx_blobs_iter;
      tx->m_metadata = *tx_metadatas_iter;
      shared_ptr<monero_outgoing_transfer> out_transfer = make_shared<monero_outgoing_transfer>();
      tx->m_outgoing_transfer = out_transfer;
      out_transfer->m_amount = *tx_amounts_iter;

      // init other known fields
      tx->m_payment_id = request.m_payment_id;
      tx->m_is_confirmed = false;
      tx->m_is_miner_tx = false;
      tx->m_is_failed = false;   // TODO: test and handle if true
      tx->m_do_not_relay = request.m_do_not_relay != boost::none && request.m_do_not_relay.get() == true;
      tx->m_is_relayed = tx->m_do_not_relay.get() != true;
      tx->m_in_tx_pool = !tx->m_do_not_relay.get();
      if (!tx->m_is_failed.get() && tx->m_is_relayed.get()) tx->m_is_double_spend_seen = false;  // TODO: test and handle if true
      tx->m_num_confirmations = 0;
      tx->m_mixin = request.m_mixin;
      tx->m_unlock_time = request.m_unlock_time == boost::none ? 0 : request.m_unlock_time.get();
      if (tx->m_is_relayed.get()) tx->m_last_relayed_timestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      out_transfer->m_account_index = request.m_account_index;
      if (request.m_subaddress_indices.size() == 1) out_transfer->m_subaddress_indices.push_back(request.m_subaddress_indices[0]);  // subaddress index is known iff 1 requested  // TODO: get all known subaddress indices here
      out_transfer->m_destinations = request.m_destinations;
      out_transfer->m_destinations[0]->m_amount = *tx_amounts_iter;

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
    std::vector<wallet2::pending_tx> ptx_vector = m_w2->create_unmixable_sweep_transactions();

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
    list<string> m_tx_ids;
    list<string> tx_blobs;
    list<string> tx_metadatas;
    epee::json_rpc::error er;
    if (!fill_response(m_w2.get(), ptx_vector, get_tx_keys, tx_keys, tx_amounts, tx_fees, multisig_tx_set, unsigned_tx_set, do_not_relay, m_tx_ids, get_tx_hex, tx_blobs, get_tx_metadata, tx_metadatas, er)) {
      throw runtime_error("need to handle error filling response!");  // TODO: return err message
    }

    // build sent txs from results  // TODO: use common utility with send_split() to avoid code duplication
    vector<shared_ptr<monero_tx_wallet>> txs;
    auto tx_ids_iter = m_tx_ids.begin();
    auto tx_keys_iter = tx_keys.begin();
    auto tx_amounts_iter = tx_amounts.begin();
    auto tx_fees_iter = tx_fees.begin();
    auto tx_blobs_iter = tx_blobs.begin();
    auto tx_metadatas_iter = tx_metadatas.begin();
    while (tx_ids_iter != m_tx_ids.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
      txs.push_back(tx);
      tx->m_id = *tx_ids_iter;
      tx->m_key = *tx_keys_iter;
      tx->m_fee = *tx_fees_iter;
      tx->m_full_hex = *tx_blobs_iter;
      tx->m_metadata = *tx_metadatas_iter;
      shared_ptr<monero_outgoing_transfer> out_transfer = make_shared<monero_outgoing_transfer>();
      tx->m_outgoing_transfer = out_transfer;
      out_transfer->m_amount = *tx_amounts_iter;

      // init other known fields
      tx->m_is_confirmed = false;
      tx->m_is_miner_tx = false;
      tx->m_is_failed = false;   // TODO: test and handle if true
      tx->m_do_not_relay = do_not_relay;
      tx->m_is_relayed = tx->m_do_not_relay.get() != true;
      tx->m_in_tx_pool = !tx->m_do_not_relay.get();
      if (!tx->m_is_failed.get() && tx->m_is_relayed.get()) tx->m_is_double_spend_seen = false;  // TODO: test and handle if true
      tx->m_num_confirmations = 0;
      //tx->m_mixin = request.m_mixin;  // TODO: how to get?
      tx->m_unlock_time = 0;
      if (tx->m_is_relayed.get()) tx->m_last_relayed_timestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      out_transfer->m_destinations[0]->m_amount = *tx_amounts_iter;

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

  string monero_wallet::get_tx_note(const string& tx_id) const {
    MTRACE("monero_wallet::get_tx_note()");
    cryptonote::blobdata tx_blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(tx_id, tx_blob) || tx_blob.size() != sizeof(crypto::hash)) {
      throw runtime_error("TX ID has invalid format");
    }
    crypto::hash tx_hash = *reinterpret_cast<const crypto::hash*>(tx_blob.data());
    return m_w2->get_tx_note(tx_hash);
  }

  vector<string> monero_wallet::get_tx_notes(const vector<string>& m_tx_ids) const {
    MTRACE("monero_wallet::get_tx_notes()");
    vector<string> notes;
    for (const auto& tx_id : m_tx_ids) notes.push_back(get_tx_note(tx_id));
    return notes;
  }

  void monero_wallet::set_tx_note(const string& tx_id, const string& note) {
    MTRACE("monero_wallet::set_tx_note()");
    cryptonote::blobdata tx_blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(tx_id, tx_blob) || tx_blob.size() != sizeof(crypto::hash)) {
      throw runtime_error("TX ID has invalid format");
    }
    crypto::hash tx_hash = *reinterpret_cast<const crypto::hash*>(tx_blob.data());
    m_w2->set_tx_note(tx_hash, note);
  }

  void monero_wallet::set_tx_notes(const vector<string>& m_tx_ids, const vector<string>& notes) {
    MTRACE("monero_wallet::set_tx_notes()");
    if (m_tx_ids.size() != notes.size()) throw runtime_error("Different amount of txids and notes");
    for (int i = 0; i < m_tx_ids.size(); i++) {
      set_tx_note(m_tx_ids[i], notes[i]);
    }
  }

  string monero_wallet::sign(const string& msg) const {
    return m_w2->sign(msg);
  }

  bool monero_wallet::verify(const string& msg, const string& address, const string& signature) const {

    // validate and parse address or url
    cryptonote::address_parse_info info;
    string err;
    if (!get_account_address_from_str_or_url(info, m_w2->nettype(), address,
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
    return m_w2->verify(msg, info.address, signature);
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
    if (!m_w2->get_tx_key(tx_hash, txKey, additional_tx_keys)) {
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
    if (!get_account_address_from_str(info, m_w2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // initialize and return tx check using wallet2
    uint64_t received_amount;
    bool in_tx_pool;
    uint64_t num_confirmations;
    m_w2->check_tx_key(tx_hash, tx_key, additional_tx_keys, info.address, received_amount, in_tx_pool, num_confirmations);
    shared_ptr<monero_check_tx> checkTx = make_shared<monero_check_tx>();
    checkTx->m_is_good = true; // check is good if we get this far
    checkTx->m_received_amount = received_amount;
    checkTx->m_in_tx_pool = in_tx_pool;
    checkTx->m_num_confirmations = num_confirmations;
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
    if (!get_account_address_from_str(info, m_w2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // get tx proof
    return m_w2->get_tx_proof(tx_hash, info.address, info.is_subaddress, message);
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
    if (!get_account_address_from_str(info, m_w2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // initialize and return tx check using wallet2
    shared_ptr<monero_check_tx> checkTx = make_shared<monero_check_tx>();
    uint64_t received_amount;
    bool in_tx_pool;
    uint64_t num_confirmations;
    checkTx->m_is_good = m_w2->check_tx_proof(tx_hash, info.address, info.is_subaddress, message, signature, received_amount, in_tx_pool, num_confirmations);
    if (checkTx->m_is_good) {
      checkTx->m_received_amount = received_amount;
      checkTx->m_in_tx_pool = in_tx_pool;
      checkTx->m_num_confirmations = num_confirmations;
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
    return m_w2->get_spend_proof(tx_hash, message);
  }

  bool monero_wallet::check_spend_proof(const string& tx_id, const string& message, const string& signature) const {
    MTRACE("monero_wallet::check_spend_proof()");

    // validate and parse tx id
    crypto::hash tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_id, tx_hash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // check spend proof
    return m_w2->check_spend_proof(tx_hash, message, signature);
  }

  string monero_wallet::get_reserve_proof_wallet(const string& message) const {
    MTRACE("monero_wallet::get_reserve_proof_wallet()");
    boost::optional<std::pair<uint32_t, uint64_t>> account_minreserve;
    return m_w2->get_reserve_proof(account_minreserve, message);
  }

  string monero_wallet::get_reserve_proof_account(uint32_t account_idx, uint64_t amount, const string& message) const {
    MTRACE("monero_wallet::get_reserve_proof_account()");
    boost::optional<std::pair<uint32_t, uint64_t>> account_minreserve;
    if (account_idx >= m_w2->get_num_subaddress_accounts()) throw runtime_error("Account index is out of bound");
    account_minreserve = std::make_pair(account_idx, amount);
    return m_w2->get_reserve_proof(account_minreserve, message);
  }

  shared_ptr<monero_check_reserve> monero_wallet::check_reserve_proof(const string& address, const string& message, const string& signature) const {
    MTRACE("monero_wallet::check_reserve_proof()");

    // validate and parse input
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, m_w2->nettype(), address)) throw runtime_error("Invalid address");
    if (info.is_subaddress) throw runtime_error("Address must not be a subaddress");

    // initialize check reserve using wallet2
    shared_ptr<monero_check_reserve> checkReserve = make_shared<monero_check_reserve>();
    uint64_t total_amount;
    uint64_t unconfirmed_spent_amount;
    checkReserve->m_is_good = m_w2->check_reserve_proof(info.address, message, signature, total_amount, unconfirmed_spent_amount);
    if (checkReserve->m_is_good) {
      checkReserve->m_total_amount = total_amount;
      checkReserve->m_unconfirmed_spent_amount = unconfirmed_spent_amount;
    }
    return checkReserve;
  }

  string monero_wallet::create_payment_uri(const monero_send_request& request) const {
    MTRACE("create_payment_uri()");

    // validate request
    if (request.m_destinations.size() != 1) throw runtime_error("Cannot make URI from supplied parameters: must provide exactly one destination to send funds");
    if (request.m_destinations.at(0)->m_address == boost::none) throw runtime_error("Cannot make URI from supplied parameters: must provide destination address");
    if (request.m_destinations.at(0)->m_amount == boost::none) throw runtime_error("Cannot make URI from supplied parameters: must provide destination amount");

    // prepare wallet2 params
    string address = request.m_destinations.at(0)->m_address.get();
    string payment_id = request.m_payment_id == boost::none ? "" : request.m_payment_id.get();
    uint64_t amount = request.m_destinations.at(0)->m_amount.get();
    string note = request.m_note == boost::none ? "" : request.m_note.get();
    string m_recipient_name = request.m_recipient_name == boost::none ? "" : request.m_recipient_name.get();

    // make uri using wallet2
    std::string error;
    string uri = m_w2->make_uri(address, payment_id, amount, note, m_recipient_name, error);
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
    string m_recipient_name;
    vector<string> unknown_parameters;
    string error;
    if (!m_w2->parse_uri(uri, address, payment_id, amount, note, m_recipient_name, unknown_parameters, error)) {
      throw runtime_error("Error parsing URI: " + error);
    }

    // initialize send request
    shared_ptr<monero_send_request> send_request = make_shared<monero_send_request>();
    shared_ptr<monero_destination> destination = make_shared<monero_destination>();
    send_request->m_destinations.push_back(destination);
    if (!address.empty()) destination->m_address = address;
    destination->m_amount = amount;
    if (!payment_id.empty()) send_request->m_payment_id = payment_id;
    if (!note.empty()) send_request->m_note = note;
    if (!m_recipient_name.empty()) send_request->m_recipient_name = m_recipient_name;
    if (!unknown_parameters.empty()) MWARNING("WARNING in monero_wallet::parse_payment_uri: URI contains unknown parameters which are discarded"); // TODO: return unknown parameters?
    return send_request;
  }

  void monero_wallet::set_attribute(const string& key, const string& val) {
    m_w2->set_attribute(key, val);
  }

  string monero_wallet::get_attribute(const string& key) const {
    return m_w2->get_attribute(key);
  }

  void monero_wallet::start_mining(boost::optional<uint64_t> num_threads, boost::optional<bool> background_mining, boost::optional<bool> ignore_battery) {
    MTRACE("start_mining()");

    // only mine on trusted daemon
    if (!m_w2->is_trusted_daemon()) throw runtime_error("This command requires a trusted daemon.");

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
    daemon_req.miner_address = m_w2->get_account().get_public_address_str(m_w2->nettype());
    daemon_req.threads_count = num_threads.get();
    daemon_req.do_background_mining = background_mining.get();
    daemon_req.ignore_battery       = ignore_battery.get();
    cryptonote::COMMAND_RPC_START_MINING::response daemon_res;
    bool r = m_w2->invoke_http_json("/start_mining", daemon_req, daemon_res);
    if (!r || daemon_res.status != CORE_RPC_STATUS_OK) {
      throw runtime_error("Couldn't start mining due to unknown error.");
    }
  }

  void monero_wallet::stop_mining() {
    MTRACE("stop_mining()");
    cryptonote::COMMAND_RPC_STOP_MINING::request daemon_req;
    cryptonote::COMMAND_RPC_STOP_MINING::response daemon_res;
    bool r = m_w2->invoke_http_json("/stop_mining", daemon_req, daemon_res);
    if (!r || daemon_res.status != CORE_RPC_STATUS_OK) {
      throw runtime_error("Couldn't stop mining due to unknown error.");
    }
  }

  void monero_wallet::save() {
    MTRACE("save()");
    m_w2->store();
  }

  void monero_wallet::move_to(string path, string password) {
    MTRACE("move_to(" << path << ", " << password << ")");
    m_w2->store_to(path, password);
  }

  void monero_wallet::close() {
    MTRACE("close()");
    m_syncing_enabled = false;
    m_syncing_thread_done = true;
    m_sync_cv.notify_one();
    m_syncing_thread.join();
    m_w2->stop();
    m_w2->deinit();
  }

  // ------------------------------- PRIVATE HELPERS ----------------------------

  void monero_wallet::init_common() {
    MTRACE("monero_wallet.cpp init_common()");
    m_w2_listener = unique_ptr<wallet2_listener>(new wallet2_listener(*this, *m_w2));
    if (get_daemon_connection() == nullptr) m_is_connected = false;
    m_is_synced = false;
    m_rescan_on_sync = false;
    m_syncing_enabled = false;
    m_syncing_thread_done = false;
    m_syncing_interval = DEFAULT_SYNC_INTERVAL_MILLIS;

    // start auto sync loop
    m_syncing_thread = boost::thread([this]() {
      this->sync_thread_func();
    });
  }

  void monero_wallet::sync_thread_func() {
    MTRACE("sync_thread_func()");
    while (true) {
      boost::mutex::scoped_lock lock(m_syncing_mutex);
      if (m_syncing_thread_done) break;
      if (m_syncing_enabled) {
        boost::posix_time::milliseconds wait_for_ms(m_syncing_interval.load());
        m_sync_cv.timed_wait(lock, wait_for_ms);
      } else {
        m_sync_cv.wait(lock);
      }
      if (m_syncing_enabled) {
        lock_and_sync();
      }
    }
  }

  monero_sync_result monero_wallet::lock_and_sync(boost::optional<uint64_t> start_height, boost::optional<monero_sync_listener&> listener) {
    bool rescan = m_rescan_on_sync.exchange(false);
    boost::lock_guard<boost::mutex> guarg(m_sync_mutex); // synchronize sync() and syncAsync()
    monero_sync_result result;
    result.m_num_blocks_fetched = 0;
    result.m_received_money = false;
    do {
      // skip if daemon is not connected or synced
      if (m_is_connected && is_daemon_synced()) {

        // rescan blockchain if requested
        if (rescan) m_w2->rescan_blockchain(false);

        // sync wallet
        result = sync_aux(start_height, listener);

        // find and save rings
        m_w2->find_and_save_rings(false);
      }
    } while (!rescan && (rescan = m_rescan_on_sync.exchange(false))); // repeat if not rescanned and rescan was requested
    return result;
  }

  monero_sync_result monero_wallet::sync_aux(boost::optional<uint64_t> start_height, boost::optional<monero_sync_listener&> listener) {
    MTRACE("sync_aux()");

    // determine sync start height
    uint64_t sync_start_height = start_height == boost::none ? max(get_height(), get_restore_height()) : *start_height;
    if (sync_start_height < get_restore_height()) set_restore_height(sync_start_height); // TODO monero core: start height processed > requested start height unless restore height manually set

    // sync wallet and return result
    m_w2_listener->on_sync_start(sync_start_height, listener);
    monero_sync_result result;
    m_w2->refresh(m_w2->is_trusted_daemon(), sync_start_height, result.m_num_blocks_fetched, result.m_received_money, true);
    if (!m_is_synced) m_is_synced = true;
    m_w2_listener->on_sync_end();
    return result;
  }

  // private helper to initialize subaddresses using transfer details
  vector<monero_subaddress> monero_wallet::get_subaddresses_aux(const uint32_t account_idx, const vector<uint32_t>& subaddress_indices, const vector<tools::wallet2::transfer_details>& transfers) const {
    vector<monero_subaddress> subaddresses;

    // get balances per subaddress as maps
    map<uint32_t, uint64_t> balancePerSubaddress = m_w2->balance_per_subaddress(account_idx);
    map<uint32_t, std::pair<uint64_t, uint64_t>> unlockedBalancePerSubaddress = m_w2->unlocked_balance_per_subaddress(account_idx);

    // get all indices if no indices given
    vector<uint32_t> subaddress_indices_req;
    if (subaddress_indices.empty()) {
      for (uint32_t subaddress_idx = 0; subaddress_idx < m_w2->get_num_subaddresses(account_idx); subaddress_idx++) {
        subaddress_indices_req.push_back(subaddress_idx);
      }
    } else {
      subaddress_indices_req = subaddress_indices;
    }

    // initialize subaddresses at indices
    for (uint32_t subaddressIndicesIdx = 0; subaddressIndicesIdx < subaddress_indices_req.size(); subaddressIndicesIdx++) {
      monero_subaddress subaddress;
      subaddress.m_account_index = account_idx;
      uint32_t subaddress_idx = subaddress_indices_req.at(subaddressIndicesIdx);
      subaddress.m_index = subaddress_idx;
      subaddress.m_address = get_address(account_idx, subaddress_idx);
      subaddress.m_label = m_w2->get_subaddress_label({account_idx, subaddress_idx});
      auto iter1 = balancePerSubaddress.find(subaddress_idx);
      subaddress.m_balance = iter1 == balancePerSubaddress.end() ? 0 : iter1->second;
      auto iter2 = unlockedBalancePerSubaddress.find(subaddress_idx);
      subaddress.m_unlocked_balance = iter2 == unlockedBalancePerSubaddress.end() ? 0 : iter2->second.first;
      cryptonote::subaddress_index index = {account_idx, subaddress_idx};
      subaddress.m_num_unspent_outputs = count_if(transfers.begin(), transfers.end(), [&](const tools::wallet2::transfer_details& td) { return !td.m_spent && td.m_subaddr_index == index; });
      subaddress.m_is_used = find_if(transfers.begin(), transfers.end(), [&](const tools::wallet2::transfer_details& td) { return td.m_subaddr_index == index; }) != transfers.end();
      subaddress.m_num_blocks_to_unlock = iter1 == balancePerSubaddress.end() ? 0 : iter2->second.second;
      subaddresses.push_back(subaddress);
    }

    return subaddresses;
  }
}
