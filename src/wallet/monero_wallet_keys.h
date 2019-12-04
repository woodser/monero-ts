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

#include "monero_wallet.h"

using namespace std;
using namespace monero;

/**
 * Public library interface.
 */
namespace monero {

  /**
   * Monero wallet implementation to provide basic offline key management.
   */
  class monero_wallet_keys : public monero_wallet {

  public:

    /**
     * Create a new wallet with a randomly generated seed.
     *
     * @param network_type is the wallet's network type (default = monero_network_type.MAINNET)
     * @param language is the wallet and mnemonic's language (default = "English")
     */
    static monero_wallet_keys* create_wallet_random(const monero_network_type network_type, const string& language);

    /**
     * Create a wallet from an existing mnemonic phrase.
     *
     * @param network_type is the wallet's network type
     * @param mnemonic is the mnemonic of the wallet to construct
     */
    static monero_wallet_keys* create_wallet_from_mnemonic(const monero_network_type network_type, const string& mnemonic);

    /**
     * Create a wallet from an address, view key, and spend key.
     *
     * @param network_type is the wallet's network type
     * @param address is the address of the wallet to construct
     * @param view_key is the view key of the wallet to construct
     * @param spend_key is the spend key of the wallet to construct
     * @param language is the wallet and mnemonic's language (default = "English")
     */
    static monero_wallet_keys* create_wallet_from_keys(const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key, const string& language = "English");

    /**
     * Destruct the wallet.
     */
    ~monero_wallet_keys();

    /**
     * Supported wallet methods.
     */
    monero_version get_version() const;
    monero_network_type get_network_type() const;
    string get_mnemonic() const;
    string get_language() const;
    vector<string> get_languages() const;
    string get_public_view_key() const;
    string get_private_view_key() const;
    string get_public_spend_key() const;
    string get_private_spend_key() const;
    string get_address(const uint32_t account_idx, const uint32_t subaddress_idx) const;
    monero_subaddress get_address_index(const string& address) const;
    monero_integrated_address get_integrated_address(const string& standard_address = "", const string& payment_id = "") const;
    monero_integrated_address decode_integrated_address(const string& integrated_address) const;
    vector<monero_account> get_accounts(bool include_subaddresses, const string& tag) const;
    monero_account get_account(const uint32_t account_idx, bool include_subaddresses) const;
    monero_account create_account(const string& label = "");
    vector<monero_subaddress> get_subaddresses(const uint32_t account_idx, const vector<uint32_t>& subaddress_indices) const;
    monero_subaddress get_subaddress(const uint32_t account_idx, const uint32_t subaddress_idx) const;
    monero_subaddress create_subaddress(uint32_t account_idx, const string& label = "");
    string sign(const string& msg) const;
    bool verify(const string& msg, const string& address, const string& signature) const;
    void close();

    // --------------------------------- PRIVATE --------------------------------

  private:
    string m_seed;
    string m_mnemonic;
    string m_language;
    string m_pub_view_key;
    string m_prv_view_key;
    string m_pub_spend_key;
    string m_prv_spend_key;
    string m_primary_address;
  };
}
