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

#include "monero_wallet_core.h"

#include "utils/monero_utils.h"
#include <chrono>
#include <iostream>
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"
#include "wallet/wallet_rpc_server_commands_defs.h"
#include "serialization/binary_utils.h"
#include "serialization/string.h"

#ifdef WIN32
#include <boost/locale.hpp>
#include <boost/filesystem.hpp>
#endif

using namespace std;
using namespace tools;

/**
 * Implements a monero_wallet.h by wrapping wallet2.h.
 */
namespace monero {

  // ------------------------- INITIALIZE CONSTANTS ---------------------------

  static const int DEFAULT_SYNC_INTERVAL_MILLIS = 1000 * 10;   // default refresh interval 10 sec
  static const int DEFAULT_CONNECTION_TIMEOUT_MILLIS = 1000 * 30; // default connection timeout 30 sec
  static const bool STRICT = false; // relies exclusively on blockchain data if true, includes local wallet data if false TODO: good use case to expose externally?

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
    tx->m_hash = epee::string_tools::pod_to_hex(pd.m_tx_hash);
    tx->m_is_incoming = true;
    tx->m_payment_id = epee::string_tools::pod_to_hex(payment_id);
    if (tx->m_payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->m_payment_id = tx->m_payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->m_payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->m_payment_id = boost::none;  // clear default payment id
    tx->m_unlock_time = pd.m_unlock_time;
    tx->m_is_locked = !m_w2.is_transfer_unlocked(pd.m_unlock_time, pd.m_block_height);
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
    tx->m_hash = epee::string_tools::pod_to_hex(txid);
    tx->m_is_outgoing = true;
    tx->m_payment_id = epee::string_tools::pod_to_hex(pd.m_payment_id);
    if (tx->m_payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->m_payment_id = tx->m_payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->m_payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->m_payment_id = boost::none;  // clear default payment id
    tx->m_unlock_time = pd.m_unlock_time;
    tx->m_is_locked = !m_w2.is_transfer_unlocked(pd.m_unlock_time, pd.m_block_height);
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
      destination->m_address = d.address(m_w2.nettype(), pd.m_payment_id);
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
    tx->m_hash = epee::string_tools::pod_to_hex(pd.m_tx_hash);
    tx->m_is_incoming = true;
    tx->m_payment_id = epee::string_tools::pod_to_hex(payment_id);
    if (tx->m_payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->m_payment_id = tx->m_payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->m_payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->m_payment_id = boost::none;  // clear default payment id
    tx->m_unlock_time = pd.m_unlock_time;
    tx->m_is_locked = true;
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
    tx->m_hash = epee::string_tools::pod_to_hex(txid);
    tx->m_is_outgoing = true;
    tx->m_payment_id = epee::string_tools::pod_to_hex(pd.m_payment_id);
    if (tx->m_payment_id->substr(16).find_first_not_of('0') == std::string::npos) tx->m_payment_id = tx->m_payment_id->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->m_payment_id == monero_tx::DEFAULT_PAYMENT_ID) tx->m_payment_id = boost::none;  // clear default payment id
    tx->m_unlock_time = pd.m_tx.unlock_time;
    tx->m_is_locked = true;
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
      destination->m_address = d.address(m_w2.nettype(), pd.m_payment_id);
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
    tx->m_hash = epee::string_tools::pod_to_hex(td.m_txid);
    tx->m_is_confirmed = true;
    tx->m_is_failed = false;
    tx->m_is_relayed = true;
    tx->m_in_tx_pool = false;
    tx->m_do_not_relay = false;
    tx->m_is_double_spend_seen = false;
    tx->m_is_locked = !m_w2.is_transfer_unlocked(td);

    // construct output
    shared_ptr<monero_output_wallet> output = make_shared<monero_output_wallet>();
    output->m_tx = tx;
    tx->m_outputs.push_back(output);
    output->m_amount = td.amount();
    output->m_index = td.m_global_output_index;
    output->m_account_index = td.m_subaddr_index.major;
    output->m_subaddress_index = td.m_subaddr_index.minor;
    output->m_is_spent = td.m_spent;
    output->m_is_frozen = td.m_frozen;
    if (td.m_key_image_known) {
      output->m_key_image = make_shared<monero_key_image>();
      output->m_key_image.get()->m_hex = epee::string_tools::pod_to_hex(td.m_key_image);
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
   * @param tx_map maps tx hashes to txs
   * @param block_map maps block heights to blocks
   * @param skip_if_absent specifies if the tx should not be added if it doesn't already exist
   */
  void merge_tx(const shared_ptr<monero_tx_wallet>& tx, map<string, shared_ptr<monero_tx_wallet>>& tx_map, map<uint64_t, shared_ptr<monero_block>>& block_map, bool skip_if_absent) {
    if (tx->m_hash == boost::none) throw runtime_error("Tx hash is not initialized");

    // if tx doesn't exist, add it (unless skipped)
    map<string, shared_ptr<monero_tx_wallet>>::const_iterator tx_iter = tx_map.find(*tx->m_hash);
    if (tx_iter == tx_map.end()) {
      if (!skip_if_absent) {
        tx_map[*tx->m_hash] = tx;
      } else {
        MWARNING("WARNING: tx does not already exist");
      }
    }

    // otherwise merge with existing tx
    else {
      shared_ptr<monero_tx_wallet>& a_tx = tx_map[*tx->m_hash];
      a_tx->merge(a_tx, tx);
    }

    // if confirmed, merge tx's block
    if (tx->get_height() != boost::none) {
      map<uint64_t, shared_ptr<monero_block>>::const_iterator block_iter = block_map.find(tx->get_height().get());
      if (block_iter == block_map.end()) {
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

  std::string get_default_ringdb_path(cryptonote::network_type nettype)
  {
    boost::filesystem::path dir = tools::get_default_data_dir();
    // remove .bitmonero, replace with .shared-ringdb
    dir = dir.remove_filename();
    dir /= ".shared-ringdb";
    if (nettype == cryptonote::TESTNET)
      dir /= "testnet";
    else if (nettype == cryptonote::STAGENET)
      dir /= "stagenet";
    return dir.string();
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
      er.code = WALLET_RPC_ERROR_CODE_WRONG_PAYMENT_ID;
      er.message = "Standalone payment IDs are obsolete. Use subaddresses or integrated addresses instead";
      return false;
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
   * Listens to wallet2 notifications in order to notify external wallet listeners.
   */
  struct wallet2_listener : public tools::i_wallet2_callback {

  public:

    /**
     * Constructs the listener.
     *
     * @param wallet provides context to notify external listeners
     * @param wallet2 provides source notifications which this listener propagates to external listeners
     */
    wallet2_listener(monero_wallet_core& wallet, tools::wallet2& m_w2) : m_wallet(wallet), m_w2(m_w2) {
      this->m_sync_start_height = boost::none;
      this->m_sync_end_height = boost::none;
    }

    ~wallet2_listener() {
      MTRACE("~wallet2_listener()");
      m_w2.callback(nullptr);
    }

    void update_listening() {
      m_w2.callback(m_wallet.get_listeners().empty() ? nullptr : this);
    }

    void on_sync_start(uint64_t start_height) {
      if (m_sync_start_height != boost::none || m_sync_end_height != boost::none) throw runtime_error("Sync start or end height should not already be allocated, is previous sync in progress?");
      m_sync_start_height = start_height;
      m_sync_end_height = m_wallet.get_daemon_height();
    }

    void on_sync_end() {
      m_sync_start_height = boost::none;
      m_sync_end_height = boost::none;
    }

    void on_new_block(uint64_t height, const cryptonote::block& cn_block) {

      // notify listeners of block
      for (monero_wallet_listener* listener : m_wallet.get_listeners()) {
        listener->on_new_block(height);
      }

      // notify listeners of sync progress
      if (m_sync_start_height != boost::none && height >= *m_sync_start_height) {
        if (height >= *m_sync_end_height) m_sync_end_height = height + 1;	// increase end height if necessary
        double percent_done = (double) (height - *m_sync_start_height + 1) / (double) (*m_sync_end_height - *m_sync_start_height);
        string message = string("Synchronizing");
        for (monero_wallet_listener* listener : m_wallet.get_listeners()) {
          listener->on_sync_progress(height, *m_sync_start_height, *m_sync_end_height, percent_done, message);
        }
      }
    }

    void on_money_received(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& cn_tx, uint64_t amount, const cryptonote::subaddress_index& subaddr_index, uint64_t unlock_time) {
      MTRACE("wallet2_listener::on_money_received()");

      // create native library tx
      shared_ptr<monero_block> block = make_shared<monero_block>();
      block->m_height = height;
      shared_ptr<monero_tx_wallet> tx = static_pointer_cast<monero_tx_wallet>(monero_utils::cn_tx_to_tx(cn_tx, true));
      block->m_txs.push_back(tx);
      tx->m_block = block;
      tx->m_hash = epee::string_tools::pod_to_hex(txid);
      tx->m_unlock_time = unlock_time;
      shared_ptr<monero_output_wallet> output = make_shared<monero_output_wallet>();
      tx->m_outputs.push_back(output);
      output->m_tx = tx;
      output->m_amount = amount;
      output->m_account_index = subaddr_index.major;
      output->m_subaddress_index = subaddr_index.minor;

      // notify listeners of output
      for (monero_wallet_listener* listener : m_wallet.get_listeners()) {
        listener->on_output_received(*output);
      }
    }

    void on_money_spent(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& cn_tx_in, uint64_t amount, const cryptonote::transaction& cn_tx_out, const cryptonote::subaddress_index& subaddr_index) {
      MTRACE("wallet2_listener::on_money_spent()");
      if (&cn_tx_in != &cn_tx_out) throw runtime_error("on_money_spent() in tx is different than out tx");

      // create native library tx
      shared_ptr<monero_block> block = make_shared<monero_block>();
      block->m_height = height;
      shared_ptr<monero_tx_wallet> tx = static_pointer_cast<monero_tx_wallet>(monero_utils::cn_tx_to_tx(cn_tx_in, true));
      block->m_txs.push_back(tx);
      tx->m_block = block;
      tx->m_hash = epee::string_tools::pod_to_hex(txid);
      shared_ptr<monero_output_wallet> output = make_shared<monero_output_wallet>();
      tx->m_inputs.push_back(output);
      output->m_tx = tx;
      output->m_amount = amount;
      output->m_account_index = subaddr_index.major;
      output->m_subaddress_index = subaddr_index.minor;

      // notify listeners of output
      for (monero_wallet_listener* listener : m_wallet.get_listeners()) {
        listener->on_output_spent(*output);
      }

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
    monero_wallet_core& m_wallet;  // wallet to provide context for notifications
    tools::wallet2& m_w2;     // internal wallet implementation to listen to
    boost::optional<uint64_t> m_sync_start_height;
    boost::optional<uint64_t> m_sync_end_height;
  };

  /**
   * Wraps a sync listener as a general wallet listener.
   */
  struct sync_listener_wrapper : public monero_wallet_listener {
  public:
    sync_listener_wrapper(monero_sync_listener& listener) : listener(listener) { }
    virtual void on_sync_progress(uint64_t height, uint64_t start_height, uint64_t end_height, double percent_done, const string& message) {
      listener.on_sync_progress(height, start_height, end_height, percent_done, message);
    }
  private:
    monero_sync_listener& listener;
  };

  // --------------------------- STATIC WALLET UTILS --------------------------

  bool monero_wallet_core::wallet_exists(const string& path) {
    MTRACE("wallet_exists(" << path << ")");
    bool key_file_exists;
    bool wallet_file_exists;
    tools::wallet2::wallet_exists(path, key_file_exists, wallet_file_exists);
    return wallet_file_exists;
  }

  monero_wallet_core* monero_wallet_core::open_wallet(const string& path, const string& password, const monero_network_type network_type) {
    MTRACE("open_wallet(" << path << ", " << password << ", " << network_type << ")");
    monero_wallet_core* wallet = new monero_wallet_core();
    wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    wallet->m_w2->load(path, password);
    wallet->m_w2->init("");
    wallet->init_common();
    return wallet;
  }

  monero_wallet_core* monero_wallet_core::open_wallet(const string& password, const monero_network_type network_type, const string& keys_data, const string& cache_data, const monero_rpc_connection& daemon_connection, shared_ptr<epee::net_utils::http::abstract_http_client> http_client) {
    MTRACE("open_wallet(...buffers...)");
    cout << "open_wallet(...buffers...)" << endl;
    monero_wallet_core* wallet = new monero_wallet_core();
    if (http_client == nullptr) wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    else wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true, http_client));
    wallet->m_w2->load("", password, keys_data, cache_data);
    wallet->m_w2->init("");
    wallet->set_daemon_connection(daemon_connection);
    wallet->init_common();
    return wallet;
  }

  monero_wallet_core* monero_wallet_core::create_wallet_random(const string& path, const string& password, const monero_network_type network_type, const monero_rpc_connection& daemon_connection, const string& language, shared_ptr<epee::net_utils::http::abstract_http_client> http_client) {
    MTRACE("create_wallet_random(path, password, network_type, daemon_connection, language)");
    monero_wallet_core* wallet = new monero_wallet_core();
    if (http_client == nullptr) wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    else wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true, http_client));
    wallet->set_daemon_connection(daemon_connection);
    wallet->m_w2->set_seed_language(language);
    crypto::secret_key secret_key;
    wallet->m_w2->generate(path, password, secret_key, false, false);
    wallet->init_common();
    if (wallet->is_connected()) wallet->m_w2->set_refresh_from_block_height(wallet->get_daemon_height());
    return wallet;
  }

  monero_wallet_core* monero_wallet_core::create_wallet_from_mnemonic(const string& path, const string& password, const monero_network_type network_type, const string& mnemonic, const monero_rpc_connection& daemon_connection, uint64_t restore_height, const string& seed_offset, shared_ptr<epee::net_utils::http::abstract_http_client> http_client) {
    MTRACE("create_wallet_from_mnemonic(path, password, mnemonic, network_type, daemon_connection, restore_height)");
    monero_wallet_core* wallet = new monero_wallet_core();

    // validate mnemonic and get recovery key and language
    crypto::secret_key recovery_key;
    string language;
    bool is_valid = crypto::ElectrumWords::words_to_bytes(mnemonic, recovery_key, language);
    if (!is_valid) throw runtime_error("Invalid mnemonic");
    if (language == crypto::ElectrumWords::old_language_name) language = Language::English().get_language_name();

    // apply offset if given
    if (!seed_offset.empty()) recovery_key = cryptonote::decrypt_key(recovery_key, seed_offset);

    // initialize wallet
    if (http_client == nullptr) wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    else wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true, http_client));
    wallet->set_daemon_connection(daemon_connection);
    wallet->m_w2->set_seed_language(language);
    wallet->m_w2->generate(path, password, recovery_key, true, false);
    wallet->m_w2->set_refresh_from_block_height(restore_height);
    wallet->init_common();
    return wallet;
  }

  monero_wallet_core* monero_wallet_core::create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key, const monero_rpc_connection& daemon_connection, uint64_t restore_height, const string& language, shared_ptr<epee::net_utils::http::abstract_http_client> http_client) {
    MTRACE("create_wallet_from_keys(path, password, address, view_key, spend_key, network_type, daemon_connection, restore_height, language)");
    monero_wallet_core* wallet = new monero_wallet_core();

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
    if (view_key.empty()) {
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
    if (http_client == nullptr) wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    else wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true, http_client));
    if (has_spend_key && has_view_key) wallet->m_w2->generate(path, password, info.address, spend_key_sk, view_key_sk);
    else if (has_spend_key) wallet->m_w2->generate(path, password, spend_key_sk, true, false);
    else wallet->m_w2->generate(path, password, info.address, view_key_sk);
    wallet->set_daemon_connection(daemon_connection);
    wallet->m_w2->set_refresh_from_block_height(restore_height);
    wallet->m_w2->set_seed_language(language);
    wallet->init_common();
    return wallet;
  }

  vector<string> monero_wallet_core::get_mnemonic_languages() {
    vector<string> languages;
    crypto::ElectrumWords::get_language_list(languages, true);
    return languages;
  }

  // ----------------------------- WALLET METHODS -----------------------------

  monero_wallet_core::~monero_wallet_core() {
    MTRACE("~monero_wallet_core()");
    close(false);
  }

  void monero_wallet_core::set_daemon_connection(const string& uri, const string& username, const string& password) {
    MTRACE("set_daemon_connection(" << uri << ", " << username << ", " << password << ")");

    // prepare uri, login, and is_trusted for wallet2
    boost::optional<epee::net_utils::http::login> login{};
    login.emplace(username, password);
    bool is_trusted = true;

    // TODO: is_local_address() uses common/util which requires libunbound
//    bool is_trusted = false;
//    try { is_trusted = tools::is_local_address(uri); }  // wallet is trusted iff local
//    catch (const exception &e) { }

    // detect ssl TODO: wallet2 does not detect ssl from uri
    epee::net_utils::ssl_support_t ssl = uri.rfind("https", 0) == 0 ? epee::net_utils::ssl_support_t::e_ssl_support_enabled : epee::net_utils::ssl_support_t::e_ssl_support_disabled;

    // init wallet2 and set daemon connection
    if (!m_w2->init(uri, login, {}, 0, is_trusted, ssl)) throw runtime_error("Failed to initialize wallet with daemon connection");
    is_connected(); // update m_is_connected cache // TODO: better naming?
  }

  void monero_wallet_core::set_daemon_connection(const boost::optional<monero_rpc_connection>& connection) {
    if (connection == boost::none) set_daemon_connection("");
    else set_daemon_connection(connection->m_uri == boost::none ? "" : connection->m_uri.get(), connection->m_username == boost::none ? "" : connection->m_username.get(), connection->m_password == boost::none ? "" : connection->m_password.get());
  }

  boost::optional<monero_rpc_connection> monero_wallet_core::get_daemon_connection() const {
    MTRACE("monero_wallet_core::get_daemon_connection()");
    if (m_w2->get_daemon_address().empty()) return boost::none;
    boost::optional<monero_rpc_connection> connection = monero_rpc_connection();
    connection->m_uri = m_w2->get_daemon_address();
    if (m_w2->get_daemon_login()) {
      if (!m_w2->get_daemon_login()->username.empty()) connection->m_username = m_w2->get_daemon_login()->username;
      epee::wipeable_string wipeablePassword = m_w2->get_daemon_login()->password;
      string password = string(wipeablePassword.data(), wipeablePassword.size());
      if (!password.empty()) connection->m_password = password;
    }
    return connection;
  }

  // TODO: could return Wallet::ConnectionStatus_Disconnected, Wallet::ConnectionStatus_WrongVersion, Wallet::ConnectionStatus_Connected like wallet.cpp::connected()
  bool monero_wallet_core::is_connected() const {
    uint32_t version = 0;
    m_is_connected = m_w2->check_connection(&version, NULL, DEFAULT_CONNECTION_TIMEOUT_MILLIS); // TODO: should this be updated elsewhere?
    if (!m_is_connected) return false;
    //if (!m_w2->light_wallet() && (version >> 16) != CORE_RPC_VERSION_MAJOR) m_is_connected = false;  // wrong network type  // TODO: disallow rpc version mismatch by configuration
    return m_is_connected;
  }

  bool monero_wallet_core::is_daemon_synced() const {
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    uint64_t daemonHeight = get_daemon_height();
    return daemonHeight >= get_daemon_max_peer_height() && daemonHeight > 1;
  }

  bool monero_wallet_core::is_daemon_trusted() const {
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    return m_w2->is_trusted_daemon();
  }

  bool monero_wallet_core::is_synced() const {
    return m_is_synced;
  }

  monero_version monero_wallet_core::get_version() const {
    monero_version version;
    version.m_number = 65552; // same as monero-wallet-rpc v0.15.0.1 release
    version.m_is_release = false;     // TODO: could pull from MONERO_VERSION_IS_RELEASE in version.cpp
    return version;
  }

  string monero_wallet_core::get_path() const {
    return m_w2->path();
  }

  monero_network_type monero_wallet_core::get_network_type() const {
    return static_cast<monero_network_type>(m_w2->nettype());
  }

  string monero_wallet_core::get_mnemonic() const {
    if (m_w2->watch_only()) throw runtime_error("The wallet is watch-only. Cannot retrieve mnemonic.");
    epee::wipeable_string wipeable_mnemonic;
    m_w2->get_seed(wipeable_mnemonic);
    return string(wipeable_mnemonic.data(), wipeable_mnemonic.size());
  }

  string monero_wallet_core::get_mnemonic_language() const {
    if (m_w2->watch_only()) throw runtime_error("The wallet is watch-only. Cannot retrieve mnemonic language.");
    return m_w2->get_seed_language();
  }

  string monero_wallet_core::get_public_view_key() const {
    MTRACE("get_private_view_key()");
    return epee::string_tools::pod_to_hex(m_w2->get_account().get_keys().m_account_address.m_view_public_key);
  }

  string monero_wallet_core::get_private_view_key() const {
    MTRACE("get_private_view_key()");
    return epee::string_tools::pod_to_hex(m_w2->get_account().get_keys().m_view_secret_key);
  }

  string monero_wallet_core::get_public_spend_key() const {
    MTRACE("get_public_spend_key()");
    return epee::string_tools::pod_to_hex(m_w2->get_account().get_keys().m_account_address.m_spend_public_key);
  }

  string monero_wallet_core::get_private_spend_key() const {
    MTRACE("get_private_spend_key()");
    string spend_key = epee::string_tools::pod_to_hex(m_w2->get_account().get_keys().m_spend_secret_key);
    if (spend_key == "0000000000000000000000000000000000000000000000000000000000000000") spend_key = "";
    return spend_key;
  }

  string monero_wallet_core::get_address(uint32_t account_idx, uint32_t subaddress_idx) const {
    return m_w2->get_subaddress_as_str({account_idx, subaddress_idx});
  }

  monero_subaddress monero_wallet_core::get_address_index(const string& address) const {
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

  monero_integrated_address monero_wallet_core::get_integrated_address(const string& standard_address, const string& payment_id) const {
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

  monero_integrated_address monero_wallet_core::decode_integrated_address(const string& integrated_address) const {
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

  uint64_t monero_wallet_core::get_height() const {
    return m_w2->get_blockchain_current_height();
  }

  uint64_t monero_wallet_core::get_restore_height() const {
    return m_w2->get_refresh_from_block_height();
  }

  void monero_wallet_core::set_restore_height(uint64_t restore_height) {
    m_w2->set_refresh_from_block_height(restore_height);
  }

  uint64_t monero_wallet_core::get_daemon_height() const {
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    std::string err;
    uint64_t result = m_w2->get_daemon_blockchain_height(err);
    if (!err.empty()) throw runtime_error(err);
    return result;
  }

  uint64_t monero_wallet_core::get_daemon_max_peer_height() const {
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    std::string err;
    uint64_t result = m_w2->get_daemon_blockchain_target_height(err);
    if (!err.empty()) throw runtime_error(err);
    if (result == 0) result = get_daemon_height();  // TODO monero core: target height can be 0 when daemon is synced.  Use blockchain height instead
    return result;
  }

  void monero_wallet_core::add_listener(monero_wallet_listener& listener) {
    MTRACE("add_listener()");
    m_listeners.insert(&listener);
    m_w2_listener->update_listening();
  }

  void monero_wallet_core::remove_listener(monero_wallet_listener& listener) {
    MTRACE("remove_listener()");
    m_listeners.erase(&listener);
    m_w2_listener->update_listening();
  }

  set<monero_wallet_listener*> monero_wallet_core::get_listeners() {
    MTRACE("get_listeners()");
    return m_listeners;
  }

  monero_sync_result monero_wallet_core::sync() {
    MTRACE("sync()");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    return lock_and_sync();
  }

  monero_sync_result monero_wallet_core::sync(monero_sync_listener& listener) {
    MTRACE("sync(listener)");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");

    // wrap and register sync listener as wallet listener
    sync_listener_wrapper listener_wrapped = sync_listener_wrapper(listener);
    add_listener(listener_wrapped);

    // sync wallet
    monero_sync_result result = lock_and_sync(boost::none);

    // unregister sync listener
    remove_listener(listener_wrapped);

    // return sync result
    return result;
  }

  monero_sync_result monero_wallet_core::sync(uint64_t start_height) {
    MTRACE("sync(" << start_height << ")");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    return lock_and_sync(start_height);
  }

  monero_sync_result monero_wallet_core::sync(uint64_t start_height, monero_sync_listener& listener) {
    MTRACE("sync(" << start_height << ", listener)");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");

    // wrap and register sync listener as wallet listener
    sync_listener_wrapper listener_wrapped = sync_listener_wrapper(listener);
    add_listener(listener_wrapped);

    // sync wallet
    monero_sync_result result = lock_and_sync(start_height);

    // unregister sync listener
    remove_listener(listener_wrapped);

    // return sync result
    return result;
  }

  /**
   * Start automatic syncing as its own thread.
   */
  void monero_wallet_core::start_syncing() {
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    if (!m_syncing_enabled) {
      m_syncing_enabled = true;
      m_sync_cv.notify_one();
    }
  }

  /**
   * Stop automatic syncing as its own thread.
   */
  void monero_wallet_core::stop_syncing() {
    if (!m_syncing_thread_done) {
      m_syncing_enabled = false;
    }
  }

  void monero_wallet_core::rescan_spent() {
    MTRACE("rescan_spent()");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    if (!is_daemon_trusted()) throw runtime_error("Rescan spent can only be used with a trusted daemon");
    m_w2->rescan_spent();
  }

  // TODO: support arguments bool hard, bool refresh = true, bool keep_key_images = false
  void monero_wallet_core::rescan_blockchain() {
    MTRACE("rescan_blockchain()");
    if (!m_is_connected) throw runtime_error("Wallet is not connected to daemon");
    m_rescan_on_sync = true;
    lock_and_sync();
  }

  // isMultisigImportNeeded

  uint64_t monero_wallet_core::get_balance() const {
    return m_w2->balance_all(STRICT);
  }

  uint64_t monero_wallet_core::get_balance(uint32_t account_idx) const {
    return m_w2->balance(account_idx, STRICT);
  }

  uint64_t monero_wallet_core::get_balance(uint32_t account_idx, uint32_t subaddress_idx) const {
    map<uint32_t, uint64_t> balance_per_subaddress = m_w2->balance_per_subaddress(account_idx, STRICT);
    auto iter = balance_per_subaddress.find(subaddress_idx);
    return iter == balance_per_subaddress.end() ? 0 : iter->second;
  }

  uint64_t monero_wallet_core::get_unlocked_balance() const {
    return m_w2->unlocked_balance_all(STRICT);
  }

  uint64_t monero_wallet_core::get_unlocked_balance(uint32_t account_idx) const {
    return m_w2->unlocked_balance(account_idx, STRICT);
  }

  uint64_t monero_wallet_core::get_unlocked_balance(uint32_t account_idx, uint32_t subaddress_idx) const {
    map<uint32_t, std::pair<uint64_t, uint64_t>> unlocked_balance_per_subaddress = m_w2->unlocked_balance_per_subaddress(account_idx, STRICT);
    auto iter = unlocked_balance_per_subaddress.find(subaddress_idx);
    return iter == unlocked_balance_per_subaddress.end() ? 0 : iter->second.first;
  }

  vector<monero_account> monero_wallet_core::get_accounts(bool include_subaddresses, const string& tag) const {
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
      account.m_balance = m_w2->balance(account_idx, STRICT);
      account.m_unlocked_balance = m_w2->unlocked_balance(account_idx, STRICT);
      if (include_subaddresses) account.m_subaddresses = get_subaddresses_aux(account_idx, vector<uint32_t>(), transfers);
      accounts.push_back(account);
    }

    return accounts;
  }

  monero_account monero_wallet_core::get_account(uint32_t account_idx, bool include_subaddresses) const {
    MTRACE("get_account(" << account_idx << ", " << include_subaddresses << ")");

    // need transfers to inform if subaddresses used
    vector<tools::wallet2::transfer_details> transfers;
    if (include_subaddresses) m_w2->get_transfers(transfers);

    // build and return account
    monero_account account;
    account.m_index = account_idx;
    account.m_primary_address = get_address(account_idx, 0);
    account.m_balance = m_w2->balance(account_idx, STRICT);
    account.m_unlocked_balance = m_w2->unlocked_balance(account_idx, STRICT);
    if (include_subaddresses) account.m_subaddresses = get_subaddresses_aux(account_idx, vector<uint32_t>(), transfers);
    return account;
  }

  monero_account monero_wallet_core::create_account(const string& label) {
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

  vector<monero_subaddress> monero_wallet_core::get_subaddresses(const uint32_t account_idx, const vector<uint32_t>& subaddress_indices) const {
    MTRACE("get_subaddresses(" << account_idx << ", ...)");
    MTRACE("Subaddress indices size: " << subaddress_indices.size());

    vector<tools::wallet2::transfer_details> transfers;
    m_w2->get_transfers(transfers);
    return get_subaddresses_aux(account_idx, subaddress_indices, transfers);
  }

  monero_subaddress monero_wallet_core::create_subaddress(const uint32_t account_idx, const string& label) {
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

  vector<shared_ptr<monero_tx_wallet>> monero_wallet_core::get_txs() const {
    return get_txs(monero_tx_query());
  }
  
  vector<shared_ptr<monero_tx_wallet>> monero_wallet_core::get_txs(const monero_tx_query& query) const {
    vector<string> missing_tx_hashes;
    vector<shared_ptr<monero_tx_wallet>> txs = monero_wallet_core::get_txs(query, missing_tx_hashes);
    if (!missing_tx_hashes.empty()) throw runtime_error("Tx not found in wallet: " + missing_tx_hashes[0]);
    return txs;
  }

  vector<shared_ptr<monero_tx_wallet>> monero_wallet_core::get_txs(const monero_tx_query& query, vector<string>& missing_tx_hashes) const {
    MTRACE("get_txs(query)");

    // copy and normalize tx query
    shared_ptr<monero_tx_query> query_ptr = make_shared<monero_tx_query>(query); // convert to shared pointer for copy
    shared_ptr<monero_tx_query> _query = query_ptr->copy(query_ptr, make_shared<monero_tx_query>()); // deep copy
    if (_query->m_transfer_query == boost::none) _query->m_transfer_query = make_shared<monero_transfer_query>();
    if (_query->m_output_query == boost::none) _query->m_output_query = make_shared<monero_output_query>();

//    // log query
//    if (_query->m_block != boost::none) MTRACE("Tx query's rooted at [block]: " << _query->m_block.get()->serialize());
//    else MTRACE("Tx _query: " << _query->serialize());

    // temporarily disable transfer and output queries in order to collect all tx information
    shared_ptr<monero_transfer_query> transfer_query = _query->m_transfer_query.get();
    shared_ptr<monero_output_query> output_query = _query->m_output_query.get();
    _query->m_transfer_query = boost::none;
    _query->m_output_query = boost::none;

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
    if ((_query->m_include_outputs != boost::none && *_query->m_include_outputs) || !output_query->is_default()) {

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

    // restore transfer and output queries
    _query->m_transfer_query = transfer_query;
    _query->m_output_query = output_query;

    // filter txs that don't meet transfer query
    vector<shared_ptr<monero_tx_wallet>> queried_txs;
    vector<shared_ptr<monero_tx_wallet>>::iterator tx_iter = txs.begin();
    while (tx_iter != txs.end()) {
      shared_ptr<monero_tx_wallet> tx = *tx_iter;
      if (_query->meets_criteria(tx.get())) {
        queried_txs.push_back(tx);
        tx_iter++;
      } else {
        tx_map.erase(tx->m_hash.get());
        tx_iter = txs.erase(tx_iter);
        if (tx->m_block != boost::none) tx->m_block.get()->m_txs.erase(std::remove(tx->m_block.get()->m_txs.begin(), tx->m_block.get()->m_txs.end(), tx), tx->m_block.get()->m_txs.end()); // TODO, no way to use tx_iter?
      }
    }
    txs = queried_txs;

    // special case: re-fetch txs if inconsistency caused by needing to make multiple wallet calls  // TODO monero core: offer wallet.get_txs(...)
    for (const shared_ptr<monero_tx_wallet>& tx : txs) {
      if (*tx->m_is_confirmed && tx->m_block == boost::none) return get_txs(*_query, missing_tx_hashes);
    }

    // if tx hashes requested, order txs and collect missing hashes
    if (!_query->m_tx_hashes.empty()) {
      txs.clear();
      for (const string& tx_hash : _query->m_tx_hashes) {
        map<string, shared_ptr<monero_tx_wallet>>::const_iterator tx_iter = tx_map.find(tx_hash);
        if (tx_iter != tx_map.end()) txs.push_back(tx_iter->second);
        else missing_tx_hashes.push_back(tx_hash);
      }
    }

    return txs;
  }

  vector<shared_ptr<monero_transfer>> monero_wallet_core::get_transfers(const monero_transfer_query& query) const {
    MTRACE("monero_wallet_core::get_transfers(query)");

//    // log query
//    if (query.m_tx_query != boost::none) {
//      if ((*query.m_tx_query)->m_block == boost::none) MTRACE("Transfer query's tx query rooted at [tx]:" << (*query.m_tx_query)->serialize());
//      else MTRACE("Transfer query's tx query rooted at [block]: " << (*(*query.m_tx_query)->m_block)->serialize());
//    }

    // copy and normalize query
    shared_ptr<monero_transfer_query> _query;
    if (query.m_tx_query == boost::none) {
      shared_ptr<monero_transfer_query> query_ptr = make_shared<monero_transfer_query>(query); // convert to shared pointer for copy  // TODO: does this copy unecessarily? copy constructor is not defined
      _query = query_ptr->copy(query_ptr, make_shared<monero_transfer_query>());
    } else {
      shared_ptr<monero_tx_query> tx_query = query.m_tx_query.get()->copy(query.m_tx_query.get(), make_shared<monero_tx_query>());
      if (query.m_tx_query.get()->m_transfer_query != boost::none && query.m_tx_query.get()->m_transfer_query.get().get() == &query) {
        _query = tx_query->m_transfer_query.get();
      } else {
        if (query.m_tx_query.get()->m_transfer_query != boost::none) throw runtime_error("Transfer query's tx query must be a circular reference or null");
        shared_ptr<monero_transfer_query> query_ptr = make_shared<monero_transfer_query>(query);  // convert query to shared pointer for copy
        _query = query_ptr->copy(query_ptr, make_shared<monero_transfer_query>());
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

      // update pool state TODO monero-core: this should be encapsulated in wallet when unconfirmed transfers queried
      std::vector<std::pair<cryptonote::transaction, bool>> process_txs;
      m_w2->update_pool_state(process_txs);
      if (!process_txs.empty()) m_w2->process_pool_state(process_txs);

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

      // tx is not incoming/outgoing unless already set
      if (tx->m_is_incoming == boost::none) tx->m_is_incoming = false;
      if (tx->m_is_outgoing == boost::none) tx->m_is_outgoing = false;

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
    MTRACE("monero_wallet_core.cpp get_transfers() returning " << transfers.size() << " transfers");

    return transfers;
  }

  vector<shared_ptr<monero_output_wallet>> monero_wallet_core::get_outputs(const monero_output_query& query) const {
    MTRACE("monero_wallet_core::get_outputs(query)");

//    // log query
//    MTRACE("Output query: " << query.serialize());
//    if (query.m_tx_query != boost::none) {
//      if ((*query.m_tx_query)->m_block == boost::none) MTRACE("Output query's tx query rooted at [tx]:" << (*query.m_tx_query)->serialize());
//      else MTRACE("Output query's tx query rooted at [block]: " << (*(*query.m_tx_query)->m_block)->serialize());
//    }

    // copy and normalize query
    shared_ptr<monero_output_query> _query;
    if (query.m_tx_query == boost::none) {
      shared_ptr<monero_output_query> query_ptr = make_shared<monero_output_query>(query); // convert to shared pointer for copy
      _query = query_ptr->copy(query_ptr, make_shared<monero_output_query>());
    } else {
      shared_ptr<monero_tx_query> tx_query = query.m_tx_query.get()->copy(query.m_tx_query.get(), make_shared<monero_tx_query>());
      if (query.m_tx_query.get()->m_output_query != boost::none && query.m_tx_query.get()->m_output_query.get().get() == &query) {
        _query = tx_query->m_output_query.get();
      } else {
        if (query.m_tx_query.get()->m_output_query != boost::none) throw runtime_error("Output query's tx query must be a circular reference or null");
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
    vector<shared_ptr<monero_output_wallet>> outputs;
    for (const shared_ptr<monero_tx_wallet>& tx : txs) {

      // sort outputs
      sort(tx->m_outputs.begin(), tx->m_outputs.end(), vout_before);

      // collect queried outputs, remove excluded outputs
      vector<shared_ptr<monero_output>>::iterator voutIter = tx->m_outputs.begin();
      while (voutIter != tx->m_outputs.end()) {
        shared_ptr<monero_output_wallet> vout_wallet = static_pointer_cast<monero_output_wallet>(*voutIter);
        if (_query->meets_criteria(vout_wallet.get())) {
          outputs.push_back(vout_wallet);
          voutIter++;
        } else {
          voutIter = tx->m_outputs.erase(voutIter); // remove excluded outputs
        }
      }

      // remove txs without outputs
      if (tx->m_outputs.empty() && tx->m_block != boost::none) tx->m_block.get()->m_txs.erase(std::remove(tx->m_block.get()->m_txs.begin(), tx->m_block.get()->m_txs.end(), tx), tx->m_block.get()->m_txs.end()); // TODO, no way to use const_iterator?
    }
    return outputs;
  }

  string monero_wallet_core::get_outputs_hex() const {
    return epee::string_tools::buff_to_hex_nodelimer(m_w2->export_outputs_to_str(true));
  }

  int monero_wallet_core::import_outputs_hex(const string& outputs_hex) {

    // validate and parse hex data
    cryptonote::blobdata blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(outputs_hex, blob)) {
      throw runtime_error("Failed to parse hex");
    }

    // import hex and return result
    return m_w2->import_outputs_from_str(blob);
  }

  vector<shared_ptr<monero_key_image>> monero_wallet_core::get_key_images() const {
    MTRACE("monero_wallet_core::get_key_images()");

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

  shared_ptr<monero_key_image_import_result> monero_wallet_core::import_key_images(const vector<shared_ptr<monero_key_image>>& key_images) {
    MTRACE("monero_wallet_core::import_key_images()");

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

  monero_tx_set monero_wallet_core::create_tx(monero_send_request& request) {
    if (request.m_can_split != boost::none && request.m_can_split.get()) throw runtime_error("Cannot request split transactions with create_tx() which prevents splitting; use create_txs() instead");
    request.m_can_split = false;
    return create_txs(request);
  }

  monero_tx_set monero_wallet_core::create_tx(uint32_t account_index, string address, uint64_t amount) {
    return create_tx(account_index, address, amount, monero_send_priority::NORMAL);
  }

  monero_tx_set monero_wallet_core::create_tx(int account_index, string address, uint64_t amount, monero_send_priority priority) {
    monero_send_request req;
    req.m_account_index = account_index;
    req.m_destinations.push_back(make_shared<monero_destination>(address, amount));
    req.m_priority = priority;
    return create_tx(req);
  }

  monero_tx_set monero_wallet_core::create_txs(monero_send_request& request) {

    // modify request to not relay
    boost::optional<bool> requested_do_not_relay = request.m_do_not_relay;
    request.m_do_not_relay = true;

    // invoke common method which doesn't relay
    monero_tx_set tx_set = send_split(request);

    // restore doNotRelay of request and txs
    request.m_do_not_relay = requested_do_not_relay;
    for (const shared_ptr<monero_tx_wallet>& tx : tx_set.m_txs) tx->m_do_not_relay = requested_do_not_relay;

    // return results
    return tx_set;
  }

  string monero_wallet_core::relay_tx(const string& tx_metadata) {
    vector<string> tx_metadatas;
    tx_metadatas.push_back(tx_metadata);
    return relay_txs(tx_metadatas)[0];
  }

  string monero_wallet_core::relay_tx(const monero_tx_wallet& tx) {
    return relay_tx(tx.m_metadata.get());
  }

  vector<string> monero_wallet_core::relay_txs(const vector<string>& tx_metadatas) {
    MTRACE("relay_txs()");

    // relay each metadata as a tx
    vector<string> tx_hashes;
    for (const auto& txMetadata : tx_metadatas) {

      // parse tx metadata hex
      cryptonote::blobdata blob;
      if (!epee::string_tools::parse_hexstr_to_binbuff(txMetadata, blob)) {
        throw runtime_error("Failed to parse hex");
      }

      // deserialize tx
      tools::wallet2::pending_tx ptx;
      try {
        std::istringstream iss(blob);
        boost::archive::portable_binary_iarchive ar(iss);
        ar >> ptx;
      } catch (...) {
        throw runtime_error("Failed to parse tx metadata");
      }

      // commit tx
      try {
        m_w2->commit_tx(ptx);
      } catch (const std::exception& e) {
        throw runtime_error("Failed to commit tx");
      }

      // collect resulting hash
      tx_hashes.push_back(epee::string_tools::pod_to_hex(cryptonote::get_transaction_hash(ptx.tx)));
    }

    // return relayed tx hashes
    return tx_hashes;
  }

  vector<string> monero_wallet_core::relay_txs(const vector<shared_ptr<monero_tx_wallet>>& txs) {
    vector<string> tx_hexes;
    for (const shared_ptr<monero_tx_wallet>& tx : txs) tx_hexes.push_back(tx->m_metadata.get());
    return relay_txs(tx_hexes);
  }

  monero_tx_set monero_wallet_core::send(const monero_send_request& request) {
    if (request.m_can_split != boost::none && request.m_can_split.get()) throw runtime_error("Cannot request split transactions with send() which prevents splitting; use sendSplit() instead");
    monero_send_request copy = request.copy();
    copy.m_can_split = false;
    return send_split(copy);
  }

  monero_tx_set monero_wallet_core::send(uint32_t account_index, string address, uint64_t amount) {
    return send(account_index, address, amount, monero_send_priority::NORMAL);
  }

  monero_tx_set monero_wallet_core::send(uint32_t account_index, string address, uint64_t amount, monero_send_priority priority) {
    monero_send_request req;
    req.m_account_index = account_index;
    req.m_destinations.push_back(make_shared<monero_destination>(address, amount));
    req.m_priority = priority;
    return send(req);
  }

  monero_tx_set monero_wallet_core::send_split(const monero_send_request& request) {
    MTRACE("monero_wallet_core::send_split(request)");
    MTRACE("monero_send_request: " << request.serialize());

    // validate request
    if (request.m_account_index == boost::none) throw runtime_error("Must specify account index to sweep from");

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
    epee::json_rpc::error err;
    if (!validate_transfer(m_w2.get(), tr_destinations, payment_id, dsts, extra, true, err)) {
      throw runtime_error(err.message);
    }

    // prepare parameters for wallet2's create_transactions_2()
    uint64_t mixin = m_w2->adjust_mixin(0); // get mixin for call to 'create_transactions_2'
    uint32_t priority = m_w2->adjust_priority(request.m_priority == boost::none ? 0 : request.m_priority.get());
    uint64_t unlock_time = request.m_unlock_time == boost::none ? 0 : request.m_unlock_time.get();
    uint32_t account_index = request.m_account_index.get();
    std::set<uint32_t> subaddress_indices;
    for (const uint32_t& subaddress_idx : request.m_subaddress_indices) subaddress_indices.insert(subaddress_idx);

    // prepare transactions
    vector<wallet2::pending_tx> ptx_vector = m_w2->create_transactions_2(dsts, mixin, unlock_time, priority, extra, account_index, subaddress_indices);
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
    string multisig_tx_hex;
    string unsigned_tx_hex;
    list<string> tx_hashes;
    list<string> tx_blobs;
    list<string> tx_metadatas;
    if (!fill_response(m_w2.get(), ptx_vector, get_tx_keys, tx_keys, tx_amounts, tx_fees, multisig_tx_hex, unsigned_tx_hex, m_do_not_relay, tx_hashes, get_tx_hex, tx_blobs, get_tx_metadata, tx_metadatas, err)) {
      throw runtime_error("need to handle error filling response!");  // TODO
    }

    // build sent txs from results  // TODO: break this into separate utility function
    vector<shared_ptr<monero_tx_wallet>> txs;
    auto tx_hashes_iter = tx_hashes.begin();
    auto tx_keys_iter = tx_keys.begin();
    auto tx_amounts_iter = tx_amounts.begin();
    auto tx_fees_iter = tx_fees.begin();
    auto tx_blobs_iter = tx_blobs.begin();
    auto tx_metadatas_iter = tx_metadatas.begin();
    while (tx_fees_iter != tx_fees.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
      txs.push_back(tx);
      tx->m_hash = *tx_hashes_iter;
      tx->m_key = *tx_keys_iter;
      tx->m_fee = *tx_fees_iter;
      tx->m_full_hex = *tx_blobs_iter;
      tx->m_metadata = *tx_metadatas_iter;
      shared_ptr<monero_outgoing_transfer> out_transfer = make_shared<monero_outgoing_transfer>();
      tx->m_outgoing_transfer = out_transfer;
      out_transfer->m_amount = *tx_amounts_iter;

      // init other known fields
      tx->m_is_outgoing = true;
      tx->m_payment_id = request.m_payment_id;
      tx->m_is_confirmed = false;
      tx->m_is_miner_tx = false;
      tx->m_is_failed = false;   // TODO: test and handle if true
      tx->m_do_not_relay = request.m_do_not_relay != boost::none && request.m_do_not_relay.get() == true;
      tx->m_is_relayed = tx->m_do_not_relay.get() != true;
      tx->m_in_tx_pool = !tx->m_do_not_relay.get();
      if (!tx->m_is_failed.get() && tx->m_is_relayed.get()) tx->m_is_double_spend_seen = false;  // TODO: test and handle if true
      tx->m_num_confirmations = 0;
      tx->m_ring_size = monero_utils::RING_SIZE;
      tx->m_unlock_time = request.m_unlock_time == boost::none ? 0 : request.m_unlock_time.get();
      tx->m_is_locked = true;
      if (tx->m_is_relayed.get()) tx->m_last_relayed_timestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      out_transfer->m_account_index = request.m_account_index;
      if (request.m_subaddress_indices.size() == 1) out_transfer->m_subaddress_indices.push_back(request.m_subaddress_indices[0]);  // subaddress index is known iff 1 requested  // TODO: get all known subaddress indices here
      out_transfer->m_destinations = request.m_destinations;

      // iterate to next element
      tx_keys_iter++;
      tx_amounts_iter++;
      tx_fees_iter++;
      tx_hashes_iter++;
      tx_blobs_iter++;
      tx_metadatas_iter++;
    }

    // build and return tx set
    monero_tx_set tx_set;
    tx_set.m_txs = txs;
    if (!multisig_tx_hex.empty()) tx_set.m_multisig_tx_hex = multisig_tx_hex;
    if (!unsigned_tx_hex.empty()) tx_set.m_unsigned_tx_hex = unsigned_tx_hex;
    return tx_set;
  }

  vector<monero_tx_set> monero_wallet_core::sweep_unlocked(const monero_send_request& request) {

    // validate request
    if (request.m_destinations.size() != 1) throw runtime_error("Must specify exactly one destination to sweep to");
    if (request.m_destinations[0]->m_address == boost::none) throw runtime_error("Must specify destination address to sweep to");
    if (request.m_account_index == boost::none && request.m_subaddress_indices.size() != 0) throw runtime_error("Must specify account index if subaddress indices are specified");

    // determine account and subaddress indices to sweep; default to all with unlocked balance if not specified
    std::map<uint32_t, vector<uint32_t>> indices;
    if (request.m_account_index != boost::none) {
      if (request.m_subaddress_indices.size() != 0) {
        indices[request.m_account_index.get()] = request.m_subaddress_indices;
      } else {
        vector<uint32_t> subaddress_indices;
        for (const monero_subaddress& subaddress : monero_wallet::get_subaddresses(request.m_account_index.get())) {
          if (subaddress.m_unlocked_balance.get() > 0) subaddress_indices.push_back(subaddress.m_index.get());
        }
        indices[request.m_account_index.get()] = subaddress_indices;
      }
    } else {
      vector<monero_account> accounts = monero_wallet::get_accounts(true);
      for (const monero_account& account : accounts) {
        if (account.m_unlocked_balance.get() > 0) {
          vector<uint32_t> subaddress_indices;
          for (const monero_subaddress& subaddress : account.m_subaddresses) {
            if (subaddress.m_unlocked_balance.get() > 0) subaddress_indices.push_back(subaddress.m_index.get());
          }
          indices[account.m_index.get()] = subaddress_indices;
        }
      }
    }

    // sweep from each account and collect resulting tx sets
    vector<monero_tx_set> tx_sets;
    for (pair<uint32_t, vector<uint32_t>> subaddress_indices_pair : indices) {

      // copy and modify the original request
      monero_send_request copy = request.copy();
      copy.m_account_index = subaddress_indices_pair.first;
      copy.m_sweep_each_subaddress = false;

      // sweep all subaddresses together  // TODO monero core: can this reveal outputs belong to the same wallet?
      if (copy.m_sweep_each_subaddress == boost::none || copy.m_sweep_each_subaddress.get() != true) {
        copy.m_subaddress_indices = subaddress_indices_pair.second;
        tx_sets.push_back(sweep_account(copy));
      }

      // otherwise sweep each subaddress individually
      else {
        for (uint32_t subaddress_index : subaddress_indices_pair.second) {
          vector<uint32_t> subaddress_indices;
          subaddress_indices.push_back(subaddress_index);
          copy.m_subaddress_indices = subaddress_indices;
          tx_sets.push_back(sweep_account(copy));
        }
      }
    }

    // return resulting tx sets
    return tx_sets;
  }

  monero_tx_set monero_wallet_core::sweep_account(const monero_send_request& request) {

    // validate request
    if (request.m_account_index == boost::none) throw runtime_error("Must specify account index to sweep from");
    if (request.m_destinations.size() != 1 || request.m_destinations[0]->m_address == boost::none || request.m_destinations[0]->m_address.get().empty()) throw runtime_error("Must provide exactly one destination address to sweep output to");
    if (request.m_destinations[0]->m_amount != boost::none) throw runtime_error("Cannot specify destination amount to sweep");
    if (request.m_key_image != boost::none) throw runtime_error("Cannot define key image in sweep_account(); use sweep_output() to sweep an output by its key image");
    if (request.m_sweep_each_subaddress != boost::none && request.m_sweep_each_subaddress.get() == true) throw runtime_error("Cannot sweep each subaddress individually with sweep_account");

    // validate the transfer requested and populate dsts & extra
    std::list<wallet_rpc::transfer_destination> destination;
    destination.push_back(wallet_rpc::transfer_destination());
    destination.back().amount = 0;
    destination.back().address = request.m_destinations[0]->m_address.get();
    string payment_id = request.m_payment_id == boost::none ? string("") : request.m_payment_id.get();
    std::vector<cryptonote::tx_destination_entry> dsts;
    std::vector<uint8_t> extra;
    epee::json_rpc::error err;
    if (!validate_transfer(m_w2.get(), destination, payment_id, dsts, extra, true, err)) {
      throw runtime_error("Failed to validate sweep_account transfer request");
    }

    // TODO monero-core: this is default `outputs` in COMMAND_RPC_SWEEP_ALL which is not documented
    uint64_t num_outputs = 1;

    // prepare parameters for wallet2's create_transactions_all()
    uint64_t below_amount = request.m_below_amount == boost::none ? 0 : request.m_below_amount.get();
    uint64_t mixin = m_w2->adjust_mixin(0);
    uint32_t priority = m_w2->adjust_priority(request.m_priority == boost::none ? 0 : request.m_priority.get());
    uint64_t unlock_time = request.m_unlock_time == boost::none ? 0 : request.m_unlock_time.get();
    uint32_t account_index = request.m_account_index.get();
    std::set<uint32_t> subaddress_indices;
    for (const uint32_t& subaddress_idx : request.m_subaddress_indices) subaddress_indices.insert(subaddress_idx);

    // prepare transactions
    std::vector<wallet2::pending_tx> ptx_vector = m_w2->create_transactions_all(below_amount, dsts[0].addr, dsts[0].is_subaddress, num_outputs, mixin, unlock_time, priority, extra, account_index, subaddress_indices);

    // config for fill_response()
    bool get_tx_keys = true;
    bool get_tx_hex = true;
    bool get_tx_metadata = true;
    bool do_not_relay = request.m_do_not_relay != boost::none && request.m_do_not_relay.get();

    // commit txs (if relaying) and get response using wallet rpc's fill_response()
    list<string> tx_keys;
    list<uint64_t> tx_amounts;
    list<uint64_t> tx_fees;
    string multisig_tx_hex;
    string unsigned_tx_hex;
    list<string> tx_hashes;
    list<string> tx_blobs;
    list<string> tx_metadatas;
    if (!fill_response(m_w2.get(), ptx_vector, get_tx_keys, tx_keys, tx_amounts, tx_fees, multisig_tx_hex, unsigned_tx_hex, do_not_relay, tx_hashes, get_tx_hex, tx_blobs, get_tx_metadata, tx_metadatas, err)) {
      throw runtime_error("need to handle error filling response!");  // TODO
    }

    // build sent txs from results  // TODO: break this into separate utility function
    vector<shared_ptr<monero_tx_wallet>> txs;
    auto tx_hashes_iter = tx_hashes.begin();
    auto tx_keys_iter = tx_keys.begin();
    auto tx_amounts_iter = tx_amounts.begin();
    auto tx_fees_iter = tx_fees.begin();
    auto tx_blobs_iter = tx_blobs.begin();
    auto tx_metadatas_iter = tx_metadatas.begin();
    while (tx_fees_iter != tx_fees.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
      txs.push_back(tx);
      tx->m_hash = *tx_hashes_iter;
      tx->m_is_locked = true;
      tx->m_is_outgoing = true;
      tx->m_key = *tx_keys_iter;
      tx->m_fee = *tx_fees_iter;
      tx->m_full_hex = *tx_blobs_iter;
      tx->m_metadata = *tx_metadatas_iter;
      shared_ptr<monero_outgoing_transfer> out_transfer = make_shared<monero_outgoing_transfer>();
      tx->m_outgoing_transfer = out_transfer;
      out_transfer->m_amount = *tx_amounts_iter;
      shared_ptr<monero_destination> destination = make_shared<monero_destination>(request.m_destinations[0]->m_address.get(), out_transfer->m_amount.get());
      out_transfer->m_destinations.push_back(destination);

      // init other known fields
      tx->m_payment_id = request.m_payment_id;
      tx->m_is_confirmed = false;
      tx->m_is_miner_tx = false;
      tx->m_is_failed = false;   // TODO: test and handle if true
      tx->m_do_not_relay = do_not_relay;
      tx->m_is_relayed = !do_not_relay;
      tx->m_in_tx_pool = !do_not_relay;
      if (!tx->m_is_failed.get() && tx->m_is_relayed.get()) tx->m_is_double_spend_seen = false;  // TODO: test and handle if true
      tx->m_num_confirmations = 0;
      tx->m_ring_size = monero_utils::RING_SIZE;
      tx->m_unlock_time = request.m_unlock_time == boost::none ? 0 : request.m_unlock_time.get();
      if (tx->m_is_relayed.get()) tx->m_last_relayed_timestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      out_transfer->m_account_index = request.m_account_index;
      if (request.m_subaddress_indices.size() == 1) out_transfer->m_subaddress_indices.push_back(request.m_subaddress_indices[0]);  // subaddress index is known iff 1 requested  // TODO: get all known subaddress indices here

      // iterate to next element
      tx_keys_iter++;
      tx_amounts_iter++;
      tx_fees_iter++;
      tx_hashes_iter++;
      tx_blobs_iter++;
      tx_metadatas_iter++;
    }

    // build and return tx set
    monero_tx_set tx_set;
    tx_set.m_txs = txs;
    if (!multisig_tx_hex.empty()) tx_set.m_multisig_tx_hex = multisig_tx_hex;
    if (!unsigned_tx_hex.empty()) tx_set.m_unsigned_tx_hex = unsigned_tx_hex;
    return tx_set;
  }

  monero_tx_set monero_wallet_core::sweep_output(const monero_send_request& request)  {
    MTRACE("sweep_output()");
    MTRACE("monero_send_request: " << request.serialize());

    // validate input request
    if (request.m_key_image == boost::none || request.m_key_image.get().empty()) throw runtime_error("Must provide key image of output to sweep");
    if (request.m_destinations.size() != 1 || request.m_destinations[0]->m_address == boost::none || request.m_destinations[0]->m_address.get().empty()) throw runtime_error("Must provide exactly one destination address to sweep output to");

    // validate the transfer queried and populate dsts & extra
    string m_payment_id = request.m_payment_id == boost::none ? string("") : request.m_payment_id.get();
    std::vector<cryptonote::tx_destination_entry> dsts;
    std::vector<uint8_t> extra;
    std::list<wallet_rpc::transfer_destination> destination;
    destination.push_back(wallet_rpc::transfer_destination());
    destination.back().amount = 0;
    destination.back().address = request.m_destinations[0]->m_address.get();
    epee::json_rpc::error err;
    if (!validate_transfer(m_w2.get(), destination, m_payment_id, dsts, extra, true, err)) {
      //throw runtime_error(er);  // TODO
      throw runtime_error("Handle validate_transfer error!");
    }

    // validate key image
    crypto::key_image ki;
    if (!epee::string_tools::hex_to_pod(request.m_key_image.get(), ki)) {
      throw runtime_error("failed to parse key image");
    }

    // create transaction
    uint64_t mixin = m_w2->adjust_mixin(0);
    uint32_t priority = m_w2->adjust_priority(request.m_priority == boost::none ? 0 : request.m_priority.get());
    uint64_t unlock_time = request.m_unlock_time == boost::none ? 0 : request.m_unlock_time.get();
    std::vector<wallet2::pending_tx> ptx_vector = m_w2->create_transactions_single(ki, dsts[0].addr, dsts[0].is_subaddress, 1, mixin, unlock_time, priority, extra);

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
    string multisig_tx_hex;
    string unsigned_tx_hex;
    list<string> tx_hashes;
    list<string> tx_blobs;
    list<string> tx_metadatas;
    if (!fill_response(m_w2.get(), ptx_vector, get_tx_keys, tx_keys, tx_amounts, tx_fees, multisig_tx_hex, unsigned_tx_hex, m_do_not_relay, tx_hashes, get_tx_hex, tx_blobs, get_tx_metadata, tx_metadatas, err)) {
      throw runtime_error("need to handle error filling response!");  // TODO: return err message
    }

    // build sent txs from results  // TODO: use common utility with send_split() to avoid code duplication
    vector<shared_ptr<monero_tx_wallet>> txs;
    auto tx_hashes_iter = tx_hashes.begin();
    auto tx_keys_iter = tx_keys.begin();
    auto tx_amounts_iter = tx_amounts.begin();
    auto tx_fees_iter = tx_fees.begin();
    auto tx_blobs_iter = tx_blobs.begin();
    auto tx_metadatas_iter = tx_metadatas.begin();
    while (tx_fees_iter != tx_fees.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
      txs.push_back(tx);
      tx->m_hash = *tx_hashes_iter;
      tx->m_is_outgoing = true;
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
      tx->m_ring_size = monero_utils::RING_SIZE;
      tx->m_unlock_time = request.m_unlock_time == boost::none ? 0 : request.m_unlock_time.get();
      tx->m_is_locked = true;
      if (tx->m_is_relayed.get()) tx->m_last_relayed_timestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      out_transfer->m_account_index = request.m_account_index;
      if (request.m_subaddress_indices.size() == 1) out_transfer->m_subaddress_indices.push_back(request.m_subaddress_indices[0]);  // subaddress index is known iff 1 requested  // TODO: get all known subaddress indices here
      out_transfer->m_destinations = request.m_destinations;
      out_transfer->m_destinations[0]->m_amount = *tx_amounts_iter;

      // iterate to next element
      tx_keys_iter++;
      tx_amounts_iter++;
      tx_fees_iter++;
      tx_hashes_iter++;
      tx_blobs_iter++;
      tx_metadatas_iter++;
    }

    // validate one transaction
    if (txs.size() != 1) throw runtime_error("Expected 1 transaction but was " + boost::lexical_cast<std::string>(txs.size()));

    // build and return tx set
    monero_tx_set tx_set;
    tx_set.m_txs = txs;
    if (!multisig_tx_hex.empty()) tx_set.m_multisig_tx_hex = multisig_tx_hex;
    if (!unsigned_tx_hex.empty()) tx_set.m_unsigned_tx_hex = unsigned_tx_hex;
    return tx_set;
  }

  monero_tx_set monero_wallet_core::sweep_dust(bool do_not_relay) {
    MTRACE("monero_wallet_core::sweep_dust()");

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
    string multisig_tx_hex;
    string unsigned_tx_hex;
    list<string> tx_hashes;
    list<string> tx_blobs;
    list<string> tx_metadatas;
    epee::json_rpc::error er;
    if (!fill_response(m_w2.get(), ptx_vector, get_tx_keys, tx_keys, tx_amounts, tx_fees, multisig_tx_hex, unsigned_tx_hex, do_not_relay, tx_hashes, get_tx_hex, tx_blobs, get_tx_metadata, tx_metadatas, er)) {
      throw runtime_error("need to handle error filling response!");  // TODO: return err message
    }

    // build sent txs from results  // TODO: use common utility with send_split() to avoid code duplication
    vector<shared_ptr<monero_tx_wallet>> txs;
    auto tx_hashes_iter = tx_hashes.begin();
    auto tx_keys_iter = tx_keys.begin();
    auto tx_amounts_iter = tx_amounts.begin();
    auto tx_fees_iter = tx_fees.begin();
    auto tx_blobs_iter = tx_blobs.begin();
    auto tx_metadatas_iter = tx_metadatas.begin();
    while (tx_fees_iter != tx_fees.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
      txs.push_back(tx);
      tx->m_hash = *tx_hashes_iter;
      tx->m_is_outgoing = true;
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
      tx->m_ring_size = monero_utils::RING_SIZE;
      tx->m_unlock_time = 0;
      if (tx->m_is_relayed.get()) tx->m_last_relayed_timestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      out_transfer->m_destinations[0]->m_amount = *tx_amounts_iter;

      // iterate to next element
      tx_keys_iter++;
      tx_amounts_iter++;
      tx_fees_iter++;
      tx_hashes_iter++;
      tx_blobs_iter++;
      tx_metadatas_iter++;
    }

    // throw exception if no dust to sweep (dust only exists pre-rct)
    if (txs.empty() && multisig_tx_hex.empty() && unsigned_tx_hex.empty()) throw runtime_error("No dust to sweep");

    // build and return tx set
    monero_tx_set tx_set;
    tx_set.m_txs = txs;
    if (!multisig_tx_hex.empty()) tx_set.m_multisig_tx_hex = multisig_tx_hex;
    if (!unsigned_tx_hex.empty()) tx_set.m_unsigned_tx_hex = unsigned_tx_hex;
    return tx_set;
  }

  monero_tx_set monero_wallet_core::parse_tx_set(const monero_tx_set& tx_set) {

    // get unsigned and multisig tx sets
    string unsigned_tx_hex = tx_set.m_unsigned_tx_hex == boost::none ? "" : tx_set.m_unsigned_tx_hex.get();
    string multisig_tx_hex = tx_set.m_multisig_tx_hex == boost::none ? "" : tx_set.m_multisig_tx_hex.get();

    // validate request
    if (m_w2->key_on_device()) throw runtime_error("command not supported by HW wallet");
    if (m_w2->watch_only()) throw runtime_error("command not supported by watch-only wallet");
    if (unsigned_tx_hex.empty() && multisig_tx_hex.empty()) throw runtime_error("no txset provided");

    std::vector <wallet2::tx_construction_data> tx_constructions;
    if (!unsigned_tx_hex.empty()) {
      try {
        tools::wallet2::unsigned_tx_set exported_txs;
        cryptonote::blobdata blob;
        if (!epee::string_tools::parse_hexstr_to_binbuff(unsigned_tx_hex, blob)) throw runtime_error("Failed to parse hex.");
        if (!m_w2->parse_unsigned_tx_from_str(blob, exported_txs)) throw runtime_error("cannot load unsigned_txset");
        tx_constructions = exported_txs.txes;
      }
      catch (const std::exception &e) {
        throw runtime_error("failed to parse unsigned transfers: " + std::string(e.what()));
      }
    } else if (!multisig_tx_hex.empty()) {
      try {
        tools::wallet2::multisig_tx_set exported_txs;
        cryptonote::blobdata blob;
        if (!epee::string_tools::parse_hexstr_to_binbuff(multisig_tx_hex, blob)) throw runtime_error("Failed to parse hex.");
        if (!m_w2->parse_multisig_tx_from_str(blob, exported_txs)) throw runtime_error("cannot load multisig_txset");
        for (size_t n = 0; n < exported_txs.m_ptx.size(); ++n) {
          tx_constructions.push_back(exported_txs.m_ptx[n].construction_data);
        }
      }
      catch (const std::exception &e) {
        throw runtime_error("failed to parse multisig transfers: " + std::string(e.what()));
      }
    }

    std::vector<tools::wallet2::pending_tx> ptx;  // TODO wallet_rpc_server: unused variable
    try {

      // gather info for each tx
      vector<shared_ptr<monero_tx_wallet>> txs;
      std::unordered_map<cryptonote::account_public_address, std::pair<std::string, uint64_t>> dests;
      int first_known_non_zero_change_index = -1;
      for (size_t n = 0; n < tx_constructions.size(); ++n)
      {
        // pre-initialize tx
        shared_ptr<monero_tx_wallet> tx = make_shared<monero_tx_wallet>();
        tx->m_is_outgoing = true;
        tx->m_input_sum = 0;
        tx->m_output_sum = 0;
        tx->m_change_amount = 0;
        tx->m_num_dummy_outputs = 0;
        tx->m_ring_size = std::numeric_limits<uint32_t>::max(); // smaller ring sizes will overwrite

        const tools::wallet2::tx_construction_data &cd = tx_constructions[n];
        std::vector<cryptonote::tx_extra_field> tx_extra_fields;
        bool has_encrypted_payment_id = false;
        crypto::hash8 payment_id8 = crypto::null_hash8;
        if (cryptonote::parse_tx_extra(cd.extra, tx_extra_fields))
        {
          cryptonote::tx_extra_nonce extra_nonce;
          if (find_tx_extra_field_by_type(tx_extra_fields, extra_nonce))
          {
            crypto::hash payment_id;
            if(cryptonote::get_encrypted_payment_id_from_tx_extra_nonce(extra_nonce.nonce, payment_id8))
            {
              if (payment_id8 != crypto::null_hash8)
              {
                tx->m_payment_id = epee::string_tools::pod_to_hex(payment_id8);
                has_encrypted_payment_id = true;
              }
            }
            else if (cryptonote::get_payment_id_from_tx_extra_nonce(extra_nonce.nonce, payment_id))
            {
              tx->m_payment_id = epee::string_tools::pod_to_hex(payment_id);
            }
          }
        }

        for (size_t s = 0; s < cd.sources.size(); ++s)
        {
          tx->m_input_sum = tx->m_input_sum.get() + cd.sources[s].amount;
          size_t ring_size = cd.sources[s].outputs.size();
          if (ring_size < tx->m_ring_size.get())
            tx->m_ring_size = ring_size;
        }
        for (size_t d = 0; d < cd.splitted_dsts.size(); ++d)
        {
          const cryptonote::tx_destination_entry &entry = cd.splitted_dsts[d];
          std::string address = cryptonote::get_account_address_as_str(m_w2->nettype(), entry.is_subaddress, entry.addr);
          if (has_encrypted_payment_id && !entry.is_subaddress && address != entry.original)
            address = cryptonote::get_account_integrated_address_as_str(m_w2->nettype(), entry.addr, payment_id8);
          auto i = dests.find(entry.addr);
          if (i == dests.end())
            dests.insert(std::make_pair(entry.addr, std::make_pair(address, entry.amount)));
          else
            i->second.second += entry.amount;
          tx->m_output_sum = tx->m_output_sum.get() + entry.amount;
        }
        if (cd.change_dts.amount > 0)
        {
          auto it = dests.find(cd.change_dts.addr);
          if (it == dests.end()) throw runtime_error("Claimed change does not go to a paid address");
          if (it->second.second < cd.change_dts.amount) throw runtime_error("Claimed change is larger than payment to the change address");
          if (cd.change_dts.amount > 0)
          {
            if (first_known_non_zero_change_index == -1)
              first_known_non_zero_change_index = n;
            const tools::wallet2::tx_construction_data &cdn = tx_constructions[first_known_non_zero_change_index];
            if (memcmp(&cd.change_dts.addr, &cdn.change_dts.addr, sizeof(cd.change_dts.addr))) throw runtime_error("Change goes to more than one address");
          }
          tx->m_change_amount = tx->m_change_amount.get() + cd.change_dts.amount;
          it->second.second -= cd.change_dts.amount;
          if (it->second.second == 0)
            dests.erase(cd.change_dts.addr);
        }

        tx->m_outgoing_transfer = make_shared<monero_outgoing_transfer>();
        size_t n_dummy_outputs = 0;
        for (auto i = dests.begin(); i != dests.end(); )
        {
          if (i->second.second > 0)
          {
            shared_ptr<monero_destination> destination = make_shared<monero_destination>();
            destination->m_address = i->second.first;
            destination->m_amount = i->second.second;
            tx->m_outgoing_transfer.get()->m_destinations.push_back(destination);
          }
          else
            tx->m_num_dummy_outputs = tx->m_num_dummy_outputs.get() + 1;
          ++i;
        }

        if (tx->m_change_amount.get() > 0)
        {
          const tools::wallet2::tx_construction_data &cd0 = tx_constructions[0];
          tx->m_change_address = get_account_address_as_str(m_w2->nettype(), cd0.subaddr_account > 0, cd0.change_dts.addr);
        }

        tx->m_fee = tx->m_input_sum.get() - tx->m_output_sum.get();
        tx->m_unlock_time = cd.unlock_time;
        tx->m_extra_hex = epee::to_hex::string({cd.extra.data(), cd.extra.size()});
        txs.push_back(tx);
      }

      // build and return tx set
      monero_tx_set tx_set;
      tx_set.m_txs = txs;
      return tx_set;
    }
    catch (const std::exception &e)
    {
      throw runtime_error("failed to parse unsigned transfers");
    }
  }

  string monero_wallet_core::sign_txs(const string& unsigned_tx_hex) {
    cout << "monero_wallet_core::sign_txs()" << endl;
    throw runtime_error("Not implemented");
  }

  vector<string> monero_wallet_core::submit_txs(const string& signed_tx_hex) {
    cout << "monero_wallet_core::submit_txs()" << endl;
    throw runtime_error("Not implemented");
  }

  string monero_wallet_core::sign(const string& msg) const {
    return m_w2->sign(msg);
  }

  bool monero_wallet_core::verify(const string& msg, const string& address, const string& signature) const {

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

  string monero_wallet_core::get_tx_key(const string& tx_hash) const {
    MTRACE("monero_wallet_core::get_tx_key()");

    // validate and parse tx hash
    crypto::hash _tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_hash, _tx_hash)) {
      throw runtime_error("TX hash has invalid format");
    }

    // get tx key and additional keys
    crypto::secret_key _tx_key;
    std::vector<crypto::secret_key> additional_tx_keys;
    if (!m_w2->get_tx_key(_tx_hash, _tx_key, additional_tx_keys)) {
      throw runtime_error("No tx secret key is stored for this tx");
    }

    // build and return tx key with additional keys
    epee::wipeable_string s;
    s += epee::to_hex::wipeable_string(_tx_key);
    for (size_t i = 0; i < additional_tx_keys.size(); ++i) {
      s += epee::to_hex::wipeable_string(additional_tx_keys[i]);
    }
    return std::string(s.data(), s.size());
  }

  shared_ptr<monero_check_tx> monero_wallet_core::check_tx_key(const string& tx_hash, const string& tx_key, const string& address) const {
    MTRACE("monero_wallet_core::check_tx_key()");

    // validate and parse tx hash
    crypto::hash _tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_hash, _tx_hash)) {
      throw runtime_error("TX hash has invalid format");
    }

    // validate and parse tx key
    epee::wipeable_string tx_key_str = tx_key;
    if (tx_key_str.size() < 64 || tx_key_str.size() % 64) {
      throw runtime_error("Tx key has invalid format");
    }
    const char *data = tx_key_str.data();
    crypto::secret_key _tx_key;
    if (!epee::wipeable_string(data, 64).hex_to_pod(unwrap(unwrap(_tx_key)))) {
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
    m_w2->check_tx_key(_tx_hash, _tx_key, additional_tx_keys, info.address, received_amount, in_tx_pool, num_confirmations);
    shared_ptr<monero_check_tx> checkTx = make_shared<monero_check_tx>();
    checkTx->m_is_good = true; // check is good if we get this far
    checkTx->m_received_amount = received_amount;
    checkTx->m_in_tx_pool = in_tx_pool;
    checkTx->m_num_confirmations = num_confirmations;
    return checkTx;
  }

  string monero_wallet_core::get_tx_proof(const string& tx_hash, const string& address, const string& message) const {

    // validate and parse tx hash
    crypto::hash _tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_hash, _tx_hash)) {
      throw runtime_error("TX hash has invalid format");
    }

    // validate and parse address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, m_w2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // get tx proof
    return m_w2->get_tx_proof(_tx_hash, info.address, info.is_subaddress, message);
  }

  shared_ptr<monero_check_tx> monero_wallet_core::check_tx_proof(const string& tx_hash, const string& address, const string& message, const string& signature) const {
    MTRACE("monero_wallet_core::check_tx_proof()");

    // validate and parse tx hash
    crypto::hash _tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_hash, _tx_hash)) {
      throw runtime_error("TX hash has invalid format");
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
    checkTx->m_is_good = m_w2->check_tx_proof(_tx_hash, info.address, info.is_subaddress, message, signature, received_amount, in_tx_pool, num_confirmations);
    if (checkTx->m_is_good) {
      checkTx->m_received_amount = received_amount;
      checkTx->m_in_tx_pool = in_tx_pool;
      checkTx->m_num_confirmations = num_confirmations;
    }
    return checkTx;
  }

  string monero_wallet_core::get_spend_proof(const string& tx_hash, const string& message) const {
    MTRACE("monero_wallet_core::get_spend_proof()");

    // validate and parse tx hash
    crypto::hash _tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_hash, _tx_hash)) {
      throw runtime_error("TX hash has invalid format");
    }

    // return spend proof signature
    return m_w2->get_spend_proof(_tx_hash, message);
  }

  bool monero_wallet_core::check_spend_proof(const string& tx_hash, const string& message, const string& signature) const {
    MTRACE("monero_wallet_core::check_spend_proof()");

    // validate and parse tx hash
    crypto::hash _tx_hash;
    if (!epee::string_tools::hex_to_pod(tx_hash, _tx_hash)) {
      throw runtime_error("TX hash has invalid format");
    }

    // check spend proof
    return m_w2->check_spend_proof(_tx_hash, message, signature);
  }

  string monero_wallet_core::get_reserve_proof_wallet(const string& message) const {
    MTRACE("monero_wallet_core::get_reserve_proof_wallet()");
    boost::optional<std::pair<uint32_t, uint64_t>> account_minreserve;
    return m_w2->get_reserve_proof(account_minreserve, message);
  }

  string monero_wallet_core::get_reserve_proof_account(uint32_t account_idx, uint64_t amount, const string& message) const {
    MTRACE("monero_wallet_core::get_reserve_proof_account()");
    boost::optional<std::pair<uint32_t, uint64_t>> account_minreserve;
    if (account_idx >= m_w2->get_num_subaddress_accounts()) throw runtime_error("Account index is out of bound");
    account_minreserve = std::make_pair(account_idx, amount);
    return m_w2->get_reserve_proof(account_minreserve, message);
  }

  shared_ptr<monero_check_reserve> monero_wallet_core::check_reserve_proof(const string& address, const string& message, const string& signature) const {
    MTRACE("monero_wallet_core::check_reserve_proof()");

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

  string monero_wallet_core::get_tx_note(const string& tx_hash) const {
    MTRACE("monero_wallet_core::get_tx_note()");
    cryptonote::blobdata tx_blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(tx_hash, tx_blob) || tx_blob.size() != sizeof(crypto::hash)) {
      throw runtime_error("TX hash has invalid format");
    }
    crypto::hash _tx_hash = *reinterpret_cast<const crypto::hash*>(tx_blob.data());
    return m_w2->get_tx_note(_tx_hash);
  }

  vector<string> monero_wallet_core::get_tx_notes(const vector<string>& tx_hashes) const {
    MTRACE("monero_wallet_core::get_tx_notes()");
    vector<string> notes;
    for (const auto& tx_hash : tx_hashes) notes.push_back(get_tx_note(tx_hash));
    return notes;
  }

  void monero_wallet_core::set_tx_note(const string& tx_hash, const string& note) {
    MTRACE("monero_wallet_core::set_tx_note()");
    cryptonote::blobdata tx_blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(tx_hash, tx_blob) || tx_blob.size() != sizeof(crypto::hash)) {
      throw runtime_error("TX hash has invalid format");
    }
    crypto::hash _tx_hash = *reinterpret_cast<const crypto::hash*>(tx_blob.data());
    m_w2->set_tx_note(_tx_hash, note);
  }

  void monero_wallet_core::set_tx_notes(const vector<string>& tx_hashes, const vector<string>& notes) {
    MTRACE("monero_wallet_core::set_tx_notes()");
    if (tx_hashes.size() != notes.size()) throw runtime_error("Different amount of txids and notes");
    for (int i = 0; i < tx_hashes.size(); i++) {
      set_tx_note(tx_hashes[i], notes[i]);
    }
  }

  vector<monero_address_book_entry> monero_wallet_core::get_address_book_entries(const vector<uint64_t>& indices) const {
    MTRACE("monero_wallet_core::get_address_book_entries()");

    // get wallet2 address book entries
    const auto w2_entries = m_w2->get_address_book();

    // build entries from wallet2 types
    vector<monero_address_book_entry> entries;
    if (indices.empty()) {
      uint64_t idx = 0;
      for (const auto &w2_entry: w2_entries) {
        monero_address_book_entry entry(idx++, cryptonote::get_account_address_as_str(m_w2->nettype(), w2_entry.m_is_subaddress, w2_entry.m_address), w2_entry.m_description, epee::string_tools::pod_to_hex(w2_entry.m_payment_id));
        entries.push_back(entry);
      }
    } else {
      for (uint64_t idx : indices) {
        if (idx >= w2_entries.size()) throw runtime_error("Index out of range: " + std::to_string(idx));
        const auto &w2_entry = w2_entries[idx];
        monero_address_book_entry entry(idx++, cryptonote::get_account_address_as_str(m_w2->nettype(), w2_entry.m_is_subaddress, w2_entry.m_address), w2_entry.m_description, epee::string_tools::pod_to_hex(w2_entry.m_payment_id));
        entries.push_back(entry);
      }
    }

    return entries;
  }

  uint64_t monero_wallet_core::add_address_book_entry(const string& address, const string& description, const string& payment_id) {
    MTRACE("add_address_book_entry()");
    cryptonote::address_parse_info info;
    crypto::hash payment_id_hash = crypto::null_hash;
    epee::json_rpc::error er;
    if(!get_account_address_from_str_or_url(info, m_w2->nettype(), address,
      [&er](const std::string &url, const std::vector<std::string> &addresses, bool dnssec_valid)->std::string {
        if (!dnssec_valid) throw runtime_error(std::string("Invalid DNSSEC for ") + url);
        if (addresses.empty()) throw runtime_error(std::string("No Monero address found at ") + url);
        return addresses[0];
      }))
    {
      throw runtime_error(std::string("WALLET_RPC_ERROR_CODE_WRONG_ADDRESS: ") + address);
    }
    if (info.has_payment_id) {
      memcpy(payment_id_hash.data, info.payment_id.data, 8);
      memset(payment_id_hash.data + 8, 0, 24);
    }
    if (!payment_id.empty()) {
      if (info.has_payment_id) throw runtime_error("Separate payment ID given with integrated address");
      crypto::hash long_payment_id;
      if (!wallet2::parse_long_payment_id(payment_id, payment_id_hash)) {
        if (!wallet2::parse_short_payment_id(payment_id, info.payment_id)) throw runtime_error("Payment id has invalid format: \"" + payment_id + "\", expected 64 character string");
        else throw runtime_error("Payment id has invalid format: standalone short payment IDs are forbidden, they must be part of an integrated address");
      }
    }
    if (!m_w2->add_address_book_row(info.address, payment_id_hash, description, info.is_subaddress)) throw runtime_error("Failed to add address book entry");
    return m_w2->get_address_book().size() - 1;
  }

  void monero_wallet_core::edit_address_book_entry(uint64_t index, bool set_address, const string& address, bool set_description, const string& description, bool set_payment_id, const string& payment_id) {
    MTRACE("edit_address_book_entry()");

    const auto ab = m_w2->get_address_book();
    if (index >= ab.size()) throw runtime_error("Index out of range: " + std::to_string(index));

    tools::wallet2::address_book_row entry = ab[index];

    cryptonote::address_parse_info info;
    crypto::hash payment_id_hash = crypto::null_hash;
    epee::json_rpc::error er;
    if (set_address) {
      er.message = "";
      if(!get_account_address_from_str_or_url(info, m_w2->nettype(), address,
        [&er](const std::string &url, const std::vector<std::string> &addresses, bool dnssec_valid)->std::string {
          if (!dnssec_valid) throw runtime_error(std::string("Invalid DNSSEC for ") + url);
          if (addresses.empty()) throw runtime_error(std::string("No Monero address found at ") + url);
          return addresses[0];
        }))
      {
        throw runtime_error("WALLET_RPC_ERROR_CODE_WRONG_ADDRESS: " + address);
      }
      entry.m_address = info.address;
      entry.m_is_subaddress = info.is_subaddress;
      if (info.has_payment_id) {
        memcpy(entry.m_payment_id.data, info.payment_id.data, 8);
        memset(entry.m_payment_id.data + 8, 0, 24);
      }
    }

    if (set_payment_id) {
      if (payment_id.empty()) {
        payment_id_hash = crypto::null_hash;
      } else {
        if (set_address && info.has_payment_id) throw runtime_error("Separate payment ID given with integrated address");
        if (!wallet2::parse_long_payment_id(payment_id, payment_id_hash)) {
          crypto::hash8 spid;
          if (!wallet2::parse_short_payment_id(payment_id, spid)) throw runtime_error("Payment id has invalid format: \"" + payment_id + "\", expected 64 character string");
          else throw runtime_error("Payment id has invalid format: standalone short payment IDs are forbidden, they must be part of an integrated address");
        }
      }
      entry.m_payment_id = payment_id_hash;
    }

    if (set_description) entry.m_description = description;

    if (!m_w2->set_address_book_row(index, entry.m_address, entry.m_payment_id, entry.m_description, entry.m_is_subaddress)) {
      throw runtime_error("Failed to edit address book entry");
    }
  }

  void monero_wallet_core::delete_address_book_entry(uint64_t index) {
    const auto w2_entries = m_w2->get_address_book();
    if (index >= w2_entries.size()) throw runtime_error("Index out of range: " + std::to_string(index));
    if (!m_w2->delete_address_book_row(index)) throw runtime_error("Failed to delete address book entry");
  }

  string monero_wallet_core::create_payment_uri(const monero_send_request& request) const {
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

  shared_ptr<monero_send_request> monero_wallet_core::parse_payment_uri(const string& uri) const {
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
    if (!unknown_parameters.empty()) MWARNING("WARNING in monero_wallet_core::parse_payment_uri: URI contains unknown parameters which are discarded"); // TODO: return unknown parameters?
    return send_request;
  }

  bool monero_wallet_core::get_attribute(const string& key, string& value) const {
    return m_w2->get_attribute(key, value);
  }

  void monero_wallet_core::set_attribute(const string& key, const string& val) {
    m_w2->set_attribute(key, val);
  }

  void monero_wallet_core::start_mining(boost::optional<uint64_t> num_threads, boost::optional<bool> background_mining, boost::optional<bool> ignore_battery) {
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
    daemon_req.ignore_battery = ignore_battery.get();
    cryptonote::COMMAND_RPC_START_MINING::response daemon_res;
    bool r = m_w2->invoke_http_json("/start_mining", daemon_req, daemon_res);
    if (!r || daemon_res.status != CORE_RPC_STATUS_OK) {
      throw runtime_error("Couldn't start mining due to unknown error.");
    }
  }

  void monero_wallet_core::stop_mining() {
    MTRACE("stop_mining()");
    cryptonote::COMMAND_RPC_STOP_MINING::request daemon_req;
    cryptonote::COMMAND_RPC_STOP_MINING::response daemon_res;
    bool r = m_w2->invoke_http_json("/stop_mining", daemon_req, daemon_res);
    if (!r || daemon_res.status != CORE_RPC_STATUS_OK) {
      throw runtime_error("Couldn't stop mining due to unknown error.");
    }
  }

  uint64_t monero_wallet_core::wait_for_next_block() {

    // use mutex and condition variable to wait for block
    boost::mutex temp;
    boost::condition_variable cv;

    // create listener which notifies condition variable when block is added
    struct block_notifier : monero_wallet_listener {
      boost::mutex* temp;
      boost::condition_variable* cv;
      uint64_t last_height;
      block_notifier(boost::mutex* temp, boost::condition_variable* cv) { this->temp = temp; this->cv = cv; }
      void on_new_block(uint64_t height) {
        last_height = height;
        cv->notify_one();
      }
    } block_listener(&temp, &cv);

    // register the listener
    add_listener(block_listener);

    // wait until condition variable is notified
    boost::mutex::scoped_lock lock(temp);
    cv.wait(lock);

    // unregister the listener
    remove_listener(block_listener);

    // return last height
    return block_listener.last_height;
  }

  bool monero_wallet_core::is_multisig_import_needed() const {
    return m_w2->multisig() && m_w2->has_multisig_partial_key_images();
  }

  monero_multisig_info monero_wallet_core::get_multisig_info() {
    monero_multisig_info info;
    info.m_is_multisig = m_w2->multisig(&info.m_is_ready, &info.m_threshold, &info.m_num_participants);
    return info;
  }

  string monero_wallet_core::prepare_multisig() {
    if (m_w2->multisig()) throw runtime_error("This wallet is already multisig");
    if (m_w2->watch_only()) throw runtime_error("This wallet is watch-only and cannot be made multisig");
    return m_w2->get_multisig_info();
  }

  monero_multisig_init_result monero_wallet_core::make_multisig(const vector<string>& multisig_hexes, int threshold, const string& password) {
    if (m_w2->multisig()) throw runtime_error("This wallet is already multisig");
    if (m_w2->watch_only()) throw runtime_error("This wallet is watch-only and cannot be made multisig");
    boost::lock_guard<boost::mutex> guarg(m_sync_mutex);  // do not refresh while making multisig
    monero_multisig_init_result result;
    result.m_multisig_hex = m_w2->make_multisig(epee::wipeable_string(password), multisig_hexes, threshold);
    result.m_address = m_w2->get_account().get_public_address_str(m_w2->nettype());
    return result;
  }

  monero_multisig_init_result monero_wallet_core::exchange_multisig_keys(const vector<string>& multisig_hexes, const string& password) {

    // validate state and args
    bool ready;
    uint32_t threshold, total;
    if (!m_w2->multisig(&ready, &threshold, &total)) throw runtime_error("This wallet is not multisig");
    if (ready) throw runtime_error("This wallet is multisig, and already finalized");
    if (multisig_hexes.size() < 1 || multisig_hexes.size() > total) throw runtime_error("Needs multisig info from more participants");

    // do not refresh while exchanging multisig keys
    boost::lock_guard<boost::mutex> guarg(m_sync_mutex);

    // import peer multisig keys and get multisig hex to be shared next round
    string multisig_hex = m_w2->exchange_multisig_keys(epee::wipeable_string(password), multisig_hexes);

    // build and return the exchange result
    monero_multisig_init_result result;
    if (!multisig_hex.empty()) result.m_multisig_hex = multisig_hex;
    else result.m_address = m_w2->get_account().get_public_address_str(m_w2->nettype());  // only return address on completion
    return result;
  }

  string monero_wallet_core::get_multisig_hex() {
    bool ready;
    if (!m_w2->multisig(&ready)) throw runtime_error("This wallet is not multisig");
    if (!ready) throw runtime_error("This wallet is multisig, but not yet finalized");
    return epee::string_tools::buff_to_hex_nodelimer(m_w2->export_multisig());
  }

  int monero_wallet_core::import_multisig_hex(const vector<string>& multisig_hexes) {

    // validate state and args
    bool ready;
    uint32_t threshold, total;
    if (!m_w2->multisig(&ready, &threshold, &total)) throw runtime_error("This wallet is not multisig");
    if (!ready) throw runtime_error("This wallet is multisig, but not yet finalized");
    if (multisig_hexes.size() < threshold - 1) throw runtime_error("Needs multisig export info from more participants");

    // validate and parse each peer multisig hex
    std::vector<cryptonote::blobdata> multisig_blobs;
    multisig_blobs.resize(multisig_hexes.size());
    for (size_t n = 0; n < multisig_hexes.size(); ++n) {
      if (!epee::string_tools::parse_hexstr_to_binbuff(multisig_hexes[n], multisig_blobs[n])) {
        throw runtime_error("Failed to parse hex");
      }
    }

    // import peer multisig hex
    int num_outputs = m_w2->import_multisig(multisig_blobs);

    // if daemon is trusted, rescan spent
    if (is_daemon_trusted()) rescan_spent();

    // return the number of outputs signed by the given multisig hex
    return num_outputs;
  }

  monero_multisig_sign_result monero_wallet_core::sign_multisig_tx_hex(const string& multisig_tx_hex) {

    // validate state and args
    bool ready;
    uint32_t threshold, total;
    if (!m_w2->multisig(&ready, &threshold, &total)) throw runtime_error("This wallet is not multisig");
    if (!ready) throw runtime_error("This wallet is multisig, but not yet finalized");

    // validate and parse multisig tx hex as blob
    cryptonote::blobdata multisig_tx_blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(multisig_tx_hex, multisig_tx_blob)) {
      throw runtime_error("Failed to parse hex");
    }

    // validate and parse blob as multisig_tx_set
    tools::wallet2::multisig_tx_set ms_tx_set;
    if (!m_w2->load_multisig_tx(multisig_tx_blob, ms_tx_set, NULL)) {
      throw runtime_error("Failed to parse multisig tx data");
    }

    // sign multisig txs
    bool success = false;
    vector<crypto::hash> tx_hashes;
    try {
      success = m_w2->sign_multisig_tx(ms_tx_set, tx_hashes);
    } catch (const std::exception& e) {
      string msg = string("Failed to sign multisig tx: ") + e.what();
      throw runtime_error(msg);
    }
    if (!success) throw runtime_error("Failed to sign multisig tx");

    // save multisig txs
    string signed_multisig_tx_hex = epee::string_tools::buff_to_hex_nodelimer(m_w2->save_multisig_tx(ms_tx_set));

    // build sign result
    monero_multisig_sign_result result;
    result.m_signed_multisig_tx_hex = signed_multisig_tx_hex;
    for (const crypto::hash& tx_hash : tx_hashes) {
      result.m_tx_hashes.push_back(epee::string_tools::pod_to_hex(tx_hash));
    }
    return result;
  }

  vector<string> monero_wallet_core::submit_multisig_tx_hex(const string& signed_multisig_tx_hex) {

    // validate state and args
    bool ready;
    uint32_t threshold, total;
    if (!m_w2->multisig(&ready, &threshold, &total)) throw runtime_error("This wallet is not multisig");
    if (!ready) throw runtime_error("This wallet is multisig, but not yet finalized");

    // validate signed multisig tx hex as blob
    cryptonote::blobdata signed_multisig_tx_blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(signed_multisig_tx_hex, signed_multisig_tx_blob)) {
      throw runtime_error("Failed to parse hex");
    }

    // validate and parse blob as multisig_tx_set
    tools::wallet2::multisig_tx_set signed_multisig_tx_set;
    if (!m_w2->load_multisig_tx(signed_multisig_tx_blob, signed_multisig_tx_set, NULL)) {
      throw runtime_error("Failed to parse multisig tx data");
    }

    // ensure sufficient number of participants have signed
    if (signed_multisig_tx_set.m_signers.size() < threshold) {
      throw runtime_error("Not enough signers signed this transaction");
    }

    // commit the transactions
    vector<string> tx_hashes;
    try {
      for (auto& pending_tx : signed_multisig_tx_set.m_ptx) {
        m_w2->commit_tx(pending_tx);
        tx_hashes.push_back(epee::string_tools::pod_to_hex(cryptonote::get_transaction_hash(pending_tx.tx)));
      }
    } catch (const std::exception& e) {
      string msg = string("Failed to submit multisig tx: ") + e.what();
      throw runtime_error(msg);
    }

    // return the resulting tx hashes
    return tx_hashes;
  }

  void monero_wallet_core::save() {
    MTRACE("save()");
    m_w2->store();
  }

  void monero_wallet_core::move_to(string path, string password) {
    MTRACE("move_to(" << path << ", " << password << ")");
    m_w2->store_to(path, password);
  }

  std::string monero_wallet_core::get_keys_file_buffer(const epee::wipeable_string& password, bool watch_only) const {
    wallet2::keys_file_data keys_file_data = {};
    bool r = m_w2->get_keys_file_data(password, watch_only, keys_file_data);
    std::string buf;
    ::serialization::dump_binary(keys_file_data, buf);
    return buf;
  }

  std::string monero_wallet_core::get_cache_file_buffer(const epee::wipeable_string& password) const {
    wallet2::cache_file_data cache_file_data = {};
    bool r = m_w2->get_cache_file_data(password, cache_file_data);

//    std::ostringstream oss;
//    binary_archive<true> oar(oss);
//    bool success = ::serialization::serialize(oar, cache_file_data);
//    return oss.str();

    std::string buf;
    ::serialization::dump_binary(cache_file_data, buf);
    return buf;
  }

  void monero_wallet_core::close(bool save) {
    MTRACE("close()");
    if (save) this->save();
    m_w2->callback(NULL);
    stop_syncing(); // prevent sync thread from starting again
    m_w2->stop();
    m_w2->deinit();
    if (!m_syncing_thread_done) {
      m_syncing_enabled = false;
      m_syncing_thread_done = true;
      m_sync_cv.notify_one();
      std::this_thread::sleep_for(std::chrono::milliseconds(1));  // TODO: in emscripten, m_sync_cv.notify_one() returns without waiting, so sleep; bug in emscripten upstream llvm?
      m_syncing_thread.join();
    }
  }

  // ------------------------------- PRIVATE HELPERS ----------------------------

  void monero_wallet_core::init_common() {
    MTRACE("monero_wallet_core.cpp init_common()");
    m_w2_listener = unique_ptr<wallet2_listener>(new wallet2_listener(*this, *m_w2));
    if (get_daemon_connection() == boost::none) m_is_connected = false;
    m_is_synced = false;
    m_rescan_on_sync = false;
    m_syncing_enabled = false;
    m_syncing_thread_done = false;
    m_syncing_interval = DEFAULT_SYNC_INTERVAL_MILLIS;

    // start auto sync loop unless single-threaded emscripten
    #if !defined(__EMSCRIPTEN__) || defined(__EMSCRIPTEN_PTHREADS__)
      m_syncing_thread = boost::thread([this]() {
        this->sync_thread_func();
      });
    #else
      tools::set_max_concurrency(1);  // TODO: single-threaded emscripten tools::get_max_concurrency() correctly returns 1 on Safari but 8 on Chrome which fails in common/threadpool constructor
    #endif
  }

  // private helper to initialize subaddresses using transfer details
  vector<monero_subaddress> monero_wallet_core::get_subaddresses_aux(const uint32_t account_idx, const vector<uint32_t>& subaddress_indices, const vector<tools::wallet2::transfer_details>& transfers) const {
    vector<monero_subaddress> subaddresses;

    // get balances per subaddress as maps
    map<uint32_t, uint64_t> balance_per_subaddress = m_w2->balance_per_subaddress(account_idx, STRICT);
    map<uint32_t, std::pair<uint64_t, uint64_t>> unlocked_balance_per_subaddress = m_w2->unlocked_balance_per_subaddress(account_idx, STRICT);

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
      auto iter1 = balance_per_subaddress.find(subaddress_idx);
      subaddress.m_balance = iter1 == balance_per_subaddress.end() ? 0 : iter1->second;
      auto iter2 = unlocked_balance_per_subaddress.find(subaddress_idx);
      subaddress.m_unlocked_balance = iter2 == unlocked_balance_per_subaddress.end() ? 0 : iter2->second.first;
      cryptonote::subaddress_index index = {account_idx, subaddress_idx};
      subaddress.m_num_unspent_outputs = count_if(transfers.begin(), transfers.end(), [&](const tools::wallet2::transfer_details& td) { return !td.m_spent && td.m_subaddr_index == index; });
      subaddress.m_is_used = find_if(transfers.begin(), transfers.end(), [&](const tools::wallet2::transfer_details& td) { return td.m_subaddr_index == index; }) != transfers.end();
      subaddress.m_num_blocks_to_unlock = iter1 == balance_per_subaddress.end() ? 0 : iter2->second.second;
      subaddresses.push_back(subaddress);
    }

    return subaddresses;
  }

  void monero_wallet_core::sync_thread_func() {
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

  monero_sync_result monero_wallet_core::lock_and_sync(boost::optional<uint64_t> start_height) {
    bool rescan = m_rescan_on_sync.exchange(false);
    boost::lock_guard<boost::mutex> guarg(m_sync_mutex); // synchronize sync() and syncAsync()
    monero_sync_result result;
    result.m_num_blocks_fetched = 0;
    result.m_received_money = false;
    do {
      // skip if daemon is not connected or synced
      if (m_is_connected && is_daemon_synced()) {

        // lock is lost on is_daemon_synced() so syncing could be disabled
        if (!m_syncing_thread_done) {

          // rescan blockchain if requested
          if (rescan) m_w2->rescan_blockchain(false);

          // sync wallet
          result = sync_aux(start_height);
        }
      }
    } while (!rescan && (rescan = m_rescan_on_sync.exchange(false))); // repeat if not rescanned and rescan was requested
    return result;
  }

  monero_sync_result monero_wallet_core::sync_aux(boost::optional<uint64_t> start_height) {
    MTRACE("sync_aux()");

    // determine sync start height
    uint64_t sync_start_height = start_height == boost::none ? max(get_height(), get_restore_height()) : *start_height;
    if (sync_start_height < get_restore_height()) set_restore_height(sync_start_height); // TODO monero core: start height processed > requested start height unless restore height manually set

    // signal start of sync to registered listeners
    m_w2_listener->on_sync_start(sync_start_height);
    monero_sync_result result;

    // attempt to refresh wallet2 which may throw exception
    try {
      m_w2->refresh(m_w2->is_trusted_daemon(), sync_start_height, result.m_num_blocks_fetched, result.m_received_money, true);
      if (!m_is_synced) m_is_synced = true;
    } catch (const exception& e) {
      MERROR("Caught error refreshing m_w2: " << e.what());
      cout << "ERROR: caught error refreshing m_w2: " << e.what() << endl;
    }

    // find and save rings
    m_w2->find_and_save_rings(false);

    // signal end of sync to registered listeners
    m_w2_listener->on_sync_end();
    return result;
  }
}
