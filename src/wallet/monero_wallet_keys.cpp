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

#include "monero_wallet_keys.h"

#include "utils/monero_utils.h"
#include <chrono>
#include <stdio.h>
#include <iostream>
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"
#include "wallet/wallet_rpc_server_commands_defs.h"

using namespace std;
using namespace epee;
using namespace tools;

/**
 * Public library interface.
 */
namespace monero {

  // ---------------------------- WALLET MANAGEMENT ---------------------------

  monero_wallet_key* monero_wallet_key::create_wallet_random(const string& path, const string& password) {
    MTRACE("create_wallet_random(path, password)");
    throw runtime_error("Not implemented");
  }

  // TODO: ensure that wallet does not already exist
  monero_wallet_key* monero_wallet_key::create_wallet_random(const string& path, const string& password, const monero_network_type network_type, const monero_rpc_connection& daemon_connection, const string& language) {
    MTRACE("create_wallet_random(path, password, network_type, daemon_connection, language)");
    monero_wallet_key* wallet = new monero_wallet_key();
    wallet->m_w2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(network_type), 1, true));
    wallet->set_daemon_connection(daemon_connection);
    wallet->m_w2->set_seed_language(language);
    crypto::secret_key secret_key;
    wallet->m_w2->generate(path, password, secret_key, false, false);
    wallet->init_common();
    if (wallet->is_connected()) wallet->m_w2->set_refresh_from_block_height(wallet->get_daemon_height());
    return wallet;
  }

  monero_wallet_key* monero_wallet_key::create_wallet_from_mnemonic(const string& path, const string& password, const monero_network_type network_type, const string& mnemonic) {
    MTRACE("create_wallet_from_mnemonic(path, password, network_type, mnemonic)");
    throw runtime_error("Not implemented");
  }

  monero_wallet_key* monero_wallet_key::create_wallet_from_mnemonic(const string& path, const string& password, const monero_network_type network_type, const string& mnemonic, const monero_rpc_connection& daemon_connection, uint64_t restore_height) {
    MTRACE("create_wallet_from_mnemonic(path, password, mnemonic, network_type, daemon_connection, restore_height)");
    monero_wallet_key* wallet = new monero_wallet_key();

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

  monero_wallet_key* monero_wallet_key::create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key) {
    MTRACE("create_wallet_from_keys(path, password, address, view_key, spend_key, network_type)");
    throw runtime_error("Not implemented");
  }

  monero_wallet_key* monero_wallet_key::create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key, const monero_rpc_connection& daemon_connection, uint64_t restore_height) {
    MTRACE("create_wallet_from_keys(path, password, address, view_key, spend_key, network_type, daemon_connection, restore_height)");
    throw runtime_error("Not implemented");
  }

  monero_wallet_key* monero_wallet_key::create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key, const monero_rpc_connection& daemon_connection, uint64_t restore_height, const string& language) {
    MTRACE("create_wallet_from_keys(path, password, address, view_key, spend_key, network_type, daemon_connection, restore_height, language)");
    monero_wallet_key* wallet = new monero_wallet_key();

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

  monero_wallet_key::~monero_wallet_key() {
    MTRACE("~monero_wallet_key()");
    close(false);
  }

  // ----------------------------- WALLET METHODS -----------------------------

  monero_version monero_wallet_key::get_version() const {
    monero_version version;
    version.m_number = 65552; // same as monero-wallet-rpc v0.15.0.1 release
    version.m_is_release = false;     // TODO: could pull from MONERO_VERSION_IS_RELEASE in version.cpp
    return version;
  }

  monero_network_type monero_wallet_key::get_network_type() const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  string monero_wallet_key::get_language() const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  vector<string> monero_wallet_key::get_languages() const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  string monero_wallet_key::get_mnemonic() const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  string monero_wallet_key::get_public_view_key() const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  string monero_wallet_key::get_private_view_key() const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  string monero_wallet_key::get_public_spend_key() const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  string monero_wallet_key::get_private_spend_key() const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  string monero_wallet_key::get_address(uint32_t account_idx, uint32_t subaddress_idx) const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  monero_subaddress monero_wallet_key::get_address_index(const string& address) const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  monero_integrated_address monero_wallet_key::get_integrated_address(const string& standard_address, const string& payment_id) const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  monero_integrated_address monero_wallet_key::decode_integrated_address(const string& integrated_address) const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  vector<monero_account> monero_wallet_key::get_accounts(bool include_subaddresses, const string& tag) const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  monero_account monero_wallet_key::get_account(uint32_t account_idx, bool include_subaddresses) const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  monero_account monero_wallet_key::create_account(const string& label) {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  vector<monero_subaddress> monero_wallet_key::get_subaddresses(const uint32_t account_idx) const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  vector<monero_subaddress> monero_wallet_key::get_subaddresses(const uint32_t account_idx, const vector<uint32_t>& subaddress_indices) const {
    throw runtime_error("monero_wallet_key::get_subaddresses() not implemented");
  }

  monero_subaddress monero_wallet_key::get_subaddress(const uint32_t account_idx, const uint32_t subaddress_idx) const {
    throw runtime_error("monero_wallet_key::getSubaddress() not implemented");
  }

  // get_subaddresses

  monero_subaddress monero_wallet_key::create_subaddress(const uint32_t account_idx, const string& label) {
    throw runtime_error("monero_wallet_key::getSubaddress() not implemented");
  }
  void monero_wallet_key::close() {
    throw runtime_error("monero_wallet_key::getSubaddress() not implemented");
  }

  // ------------------------------- PRIVATE HELPERS ----------------------------
}
