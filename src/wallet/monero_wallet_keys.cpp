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

#include "monero_wallet_keys.h"

#include "utils/monero_utils.h"
#include <chrono>
#include <iostream>
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"
#include "cryptonote_basic/cryptonote_format_utils.h"
#include "cryptonote_basic/cryptonote_basic_impl.h"
#include "string_tools.h"
#include "device/device.hpp"

using namespace epee;
using namespace tools;
using namespace crypto;

/**
 * Public library interface.
 */
namespace monero {

  // ---------------------------- WALLET MANAGEMENT ---------------------------

  monero_wallet_keys* monero_wallet_keys::create_wallet_random(const monero_network_type network_type, const std::string& language) {

    // validate language
    if (!monero_utils::is_valid_language(language)) throw std::runtime_error("Unknown language: " + language);

    // initialize random wallet account
    monero_wallet_keys* wallet = new monero_wallet_keys();
    crypto::secret_key spend_key_sk = wallet->m_account.generate();

    // initialize remaining wallet
    wallet->m_network_type = network_type;
    wallet->m_language = language;
    epee::wipeable_string wipeable_mnemonic;
    if (!crypto::ElectrumWords::bytes_to_words(spend_key_sk, wipeable_mnemonic, wallet->m_language)) {
      throw std::runtime_error("Failed to create mnemonic from private spend key for language: " + std::string(wallet->m_language));
    }
    wallet->m_mnemonic = std::string(wipeable_mnemonic.data(), wipeable_mnemonic.size());
    wallet->init_common();

    return wallet;
  }

  monero_wallet_keys* monero_wallet_keys::create_wallet_from_mnemonic(const monero_network_type network_type, const std::string& mnemonic, const std::string& seed_offset) {

    // validate mnemonic and get recovery key and language
    crypto::secret_key spend_key_sk;
    std::string language;
    bool is_valid = crypto::ElectrumWords::words_to_bytes(mnemonic, spend_key_sk, language);
    if (!is_valid) throw std::runtime_error("Invalid mnemonic");
    if (language == crypto::ElectrumWords::old_language_name) language = Language::English().get_language_name();

    // apply offset if given
    if (!seed_offset.empty()) spend_key_sk = cryptonote::decrypt_key(spend_key_sk, seed_offset);

    // initialize wallet account
    monero_wallet_keys* wallet = new monero_wallet_keys();
    wallet->m_account = cryptonote::account_base{};
    wallet->m_account.generate(spend_key_sk, true, false);

    // initialize remaining wallet
    wallet->m_network_type = network_type;
    wallet->m_language = language;
    epee::wipeable_string wipeable_mnemonic;
    if (!crypto::ElectrumWords::bytes_to_words(spend_key_sk, wipeable_mnemonic, wallet->m_language)) {
      throw std::runtime_error("Failed to create mnemonic from private spend key for language: " + std::string(wallet->m_language));
    }
    wallet->m_mnemonic = std::string(wipeable_mnemonic.data(), wipeable_mnemonic.size());
    wallet->init_common();

    return wallet;
  }

  monero_wallet_keys* monero_wallet_keys::create_wallet_from_keys(const monero_network_type network_type, const std::string& address, const std::string& view_key, const std::string& spend_key, const std::string& language) {

    // parse and validate private spend key
    crypto::secret_key spend_key_sk;
    bool has_spend_key = false;
    if (!spend_key.empty()) {
      cryptonote::blobdata spend_key_data;
      if (!epee::string_tools::parse_hexstr_to_binbuff(spend_key, spend_key_data) || spend_key_data.size() != sizeof(crypto::secret_key)) {
        throw std::runtime_error("failed to parse secret spend key");
      }
      has_spend_key = true;
      spend_key_sk = *reinterpret_cast<const crypto::secret_key*>(spend_key_data.data());
    }

    // parse and validate private view key
    bool has_view_key = true;
    crypto::secret_key view_key_sk;
    if (view_key.empty()) {
      if (has_spend_key) has_view_key = false;
      else throw std::runtime_error("Neither spend key nor view key supplied");
    }
    if (has_view_key) {
      cryptonote::blobdata view_key_data;
      if (!epee::string_tools::parse_hexstr_to_binbuff(view_key, view_key_data) || view_key_data.size() != sizeof(crypto::secret_key)) {
        throw std::runtime_error("failed to parse secret view key");
      }
      view_key_sk = *reinterpret_cast<const crypto::secret_key*>(view_key_data.data());
    }

    // parse and validate address
    cryptonote::address_parse_info address_info;
    if (address.empty()) {
      if (has_view_key) throw std::runtime_error("must provide address if providing private view key");
    } else {
      if (!get_account_address_from_str(address_info, static_cast<cryptonote::network_type>(network_type), address)) throw std::runtime_error("failed to parse address");

      // check the spend and view keys match the given address
      crypto::public_key pkey;
      if (has_spend_key) {
        if (!crypto::secret_key_to_public_key(spend_key_sk, pkey)) throw std::runtime_error("failed to verify secret spend key");
        if (address_info.address.m_spend_public_key != pkey) throw std::runtime_error("spend key does not match address");
      }
      if (has_view_key) {
        if (!crypto::secret_key_to_public_key(view_key_sk, pkey)) throw std::runtime_error("failed to verify secret view key");
        if (address_info.address.m_view_public_key != pkey) throw std::runtime_error("view key does not match address");
      }
    }

    // validate language
    if (!monero_utils::is_valid_language(language)) throw std::runtime_error("Unknown language: " + language);

    // initialize wallet account
    monero_wallet_keys* wallet = new monero_wallet_keys();
    if (has_spend_key && has_view_key) {
      wallet->m_account.create_from_keys(address_info.address, spend_key_sk, view_key_sk);
    } else if (has_spend_key) {
      wallet->m_account.generate(spend_key_sk, true, false);
    } else {
      wallet->m_account.create_from_viewkey(address_info.address, view_key_sk);
    }

    // initialize remaining wallet
    wallet->m_is_view_only = !has_spend_key;
    wallet->m_network_type = network_type;
    if (!spend_key.empty()) {
      wallet->m_language = language;
      epee::wipeable_string wipeable_mnemonic;
      if (!crypto::ElectrumWords::bytes_to_words(spend_key_sk, wipeable_mnemonic, wallet->m_language)) {
        throw std::runtime_error("Failed to create mnemonic from private spend key for language: " + std::string(wallet->m_language));
      }
      wallet->m_mnemonic = std::string(wipeable_mnemonic.data(), wipeable_mnemonic.size());
    }
    wallet->init_common();

    return wallet;
  }

  std::vector<std::string> monero_wallet_keys::get_mnemonic_languages() {
    std::vector<std::string> languages;
    crypto::ElectrumWords::get_language_list(languages, true);  // TODO: support getting names in language
    return languages;
  }

  // ----------------------------- WALLET METHODS -----------------------------

  monero_wallet_keys::~monero_wallet_keys() {
    MTRACE("~monero_wallet_keys()");
    close();
  }

  monero_version monero_wallet_keys::get_version() const {
    monero_version version;
    version.m_number = 65552; // same as monero-wallet-rpc v0.15.0.1 release
    version.m_is_release = false; // TODO: could pull from MONERO_VERSION_IS_RELEASE in version.cpp
    return version;
  }

  std::string monero_wallet_keys::get_address(uint32_t account_idx, uint32_t subaddress_idx) const {
    hw::device &hwdev = m_account.get_device();
    cryptonote::subaddress_index index{account_idx, subaddress_idx};
    cryptonote::account_public_address address = hwdev.get_subaddress(m_account.get_keys(), index);
    return cryptonote::get_account_address_as_str(static_cast<cryptonote::network_type>(m_network_type), !index.is_zero(), address);
  }

  monero_integrated_address monero_wallet_keys::get_integrated_address(const std::string& standard_address, const std::string& payment_id) const {
    std::cout << "monero_wallet_keys::get_integrated_address()" << std::endl;
    throw std::runtime_error("monero_wallet_keys::get_integrated_address() not implemented");
  }

  monero_integrated_address monero_wallet_keys::decode_integrated_address(const std::string& integrated_address) const {
    std::cout << "monero_wallet_keys::decode_integrated_address()" << std::endl;
    throw std::runtime_error("monero_wallet_keys::decode_integrated_address() not implemented");
  }

  monero_account monero_wallet_keys::get_account(uint32_t account_idx, bool include_subaddresses) const {
    std::cout << "monero_wallet_keys::get_account()" << std::endl;

    if (include_subaddresses) {
      std::string err = "monero_wallet_keys::get_account(account_idx, include_subaddresses) include_subaddresses must be false";
      std::cout << err << std::endl;
      throw std::runtime_error(err);
    }

    // build and return account
    monero_account account;
    account.m_index = account_idx;
    account.m_primary_address = get_address(account_idx, 0);
    return account;
  }

  std::vector<monero_subaddress> monero_wallet_keys::get_subaddresses(const uint32_t account_idx, const std::vector<uint32_t>& subaddress_indices) const {

    // must provide subaddress indices
    if (subaddress_indices.empty()) {
      std::string err = "Keys-only wallet does not have enumerable set of subaddresses; specific specific subaddresses";
      std::cout << err << std::endl;
      throw std::runtime_error(err);
    }

    // initialize subaddresses at indices
    std::vector<monero_subaddress> subaddresses;
    for (uint32_t subaddressIndicesIdx = 0; subaddressIndicesIdx < subaddress_indices.size(); subaddressIndicesIdx++) {
      monero_subaddress subaddress;
      subaddress.m_account_index = account_idx;
      uint32_t subaddress_idx = subaddress_indices.at(subaddressIndicesIdx);
      subaddress.m_index = subaddress_idx;
      subaddress.m_address = get_address(account_idx, subaddress_idx);
      subaddresses.push_back(subaddress);
    }

    return subaddresses;
  }

  std::string monero_wallet_keys::sign_message(const std::string& msg, monero_message_signature_type signature_type, uint32_t account_idx, uint32_t subaddress_idx) const {
    std::cout << "monero_wallet_keys::sign_message()" << std::endl;
    throw std::runtime_error("monero_wallet_keys::sign_message() not implemented");
  }

  monero_message_signature_result monero_wallet_keys::verify_message(const std::string& msg, const std::string& address, const std::string& signature) const {
    std::cout << "monero_wallet_keys::verify_message()" << std::endl;
    throw std::runtime_error("monero_wallet_keys::verify_message() not implemented");
  }

  void monero_wallet_keys::close(bool save) {
    if (save) throw std::runtime_error("MoneroWalletKeys does not support saving");
    // no pointers to destroy
  }

  // ------------------------------- PRIVATE HELPERS ----------------------------

  void monero_wallet_keys::init_common() {
    m_primary_address = m_account.get_public_address_str(static_cast<cryptonote::network_type>(m_network_type));
    const cryptonote::account_keys& keys = m_account.get_keys();
    m_pub_view_key = epee::string_tools::pod_to_hex(keys.m_account_address.m_view_public_key);
    m_prv_view_key = epee::string_tools::pod_to_hex(keys.m_view_secret_key);
    m_pub_spend_key = epee::string_tools::pod_to_hex(keys.m_account_address.m_spend_public_key);
    m_prv_spend_key = epee::string_tools::pod_to_hex(keys.m_spend_secret_key);
    if (m_prv_spend_key == "0000000000000000000000000000000000000000000000000000000000000000") m_prv_spend_key = "";
  }
}
