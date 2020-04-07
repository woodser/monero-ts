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
#include "wallet/wallet2.h"

#include <boost/thread/mutex.hpp>
#include <boost/thread/thread.hpp>
#include <boost/thread/condition_variable.hpp>

using namespace std;

/**
 * Implements a monero_wallet.h by wrapping wallet2.h.
 */
namespace monero {

  // -------------------------------- LISTENERS -------------------------------

  // forward declaration of internal wallet2 listener
  struct wallet2_listener;

  // --------------------------- STATIC WALLET UTILS --------------------------

  /**
   * Monero wallet implmentation which uses monero-project's wallet2.
   */
  class monero_wallet_core : public monero_wallet {

  public:

    /**
     * Indicates if a wallet exists at the given path.
     *
     * @param path is the path to check for a wallet
     * @return true if a wallet exists at the given path, false otherwise
     */
    static bool wallet_exists(const string& path);

    /**
     * Open an existing wallet from disk.
     *
     * @param path is the path to the wallet file to open
     * @param password is the password of the wallet file to open
     * @param network_type is the wallet's network type
     * @return a pointer to the wallet instance
     */
    static monero_wallet_core* open_wallet(const string& path, const string& password, const monero_network_type network_type);

    /**
     * Open an in-memory wallet from existing data buffers.
     *
     * TODO: support path = "" which autosaves?
     *
     * @param password is the password of the wallet file to open
     * @param network_type is the wallet's network type
     * @param keys_data contains the contents of the ".keys" file
     * @param cache_data contains the contents of the wallet cache file (no extension)
     * @param daemon_connection is connection information to a daemon (default = an unconnected wallet)
     * @param http_client_factory allows use of custom http clients
     * @return a pointer to the wallet instance
     */
    static monero_wallet_core* open_wallet(const string& password, const monero_network_type, const string& keys_data, const string& cache_data, const monero_rpc_connection& daemon_connection = monero_rpc_connection(), unique_ptr<epee::net_utils::http::http_client_factory> http_client_factory = nullptr);

    /**
     * Create a new wallet with a randomly generated seed.
     *
     * @param path is the path to create the wallet ("" for an in-memory wallet)
     * @param password is the password encrypt the wallet
     * @param network_type is the wallet's network type's
     * @param daemon_connection is connection information to a daemon (defaults to an unconnected wallet)
     * @param language is the wallet and mnemonic's language (defaults to "English")
     * @param http_client_factory allows use of custom http clients
     * @return a pointer to the wallet instance
     */
    static monero_wallet_core* create_wallet_random(const string& path, const string& password, const monero_network_type network_type, const monero_rpc_connection& daemon_connection = monero_rpc_connection(), const string& language = "English", unique_ptr<epee::net_utils::http::http_client_factory> http_client_factory = nullptr);

    /**
     * Create a wallet from an existing mnemonic phrase.
     *
     * @param path is the path to create the wallet ("" for an in-memory wallet)
     * @param password is the password encrypt the wallet     * @param network_type is the wallet's network type
     * @param mnemonic is the mnemonic of the wallet to construct
     * @param daemon_connection is connection information to a daemon (defaults to an unconnected wallet)
     * @param restore_height is the block height to restore from (default = 0)
     * @param seed_offset is the offset used to derive a new seed from the given mnemonic to recover a secret wallet from the mnemonic phrase (default = "")
     * @param http_client_factory allows use of custom http clients
     * @return a pointer to the wallet instance
     */
    static monero_wallet_core* create_wallet_from_mnemonic(const string& path, const string& password, const monero_network_type network_type, const string& mnemonic, const monero_rpc_connection& daemon_connection = monero_rpc_connection(), uint64_t restore_height = 0, const string& seed_offset = "", unique_ptr<epee::net_utils::http::http_client_factory> http_client_factory = nullptr);

    /**
     * Create a wallet from an address, view key, and spend key.
     *
     * @param path is the path to create the wallet ("" for an in-memory wallet)
     * @param password is the password encrypt the wallet (defaults to in-memory wallet with password "")
     * @param network_type is the wallet's network type
     * @param address is the address of the wallet to construct
     * @param view_key is the private view key of the wallet to construct
     * @param spend_key is the private spend key of the wallet to construct
     * @param daemon_connection is connection information to a daemon (defaults to an unconnected wallet)
     * @param restore_height is the block height to restore (i.e. scan the chain) from (default = 0)
     * @param language is the wallet and mnemonic's language (defaults to "English")
     * @param http_client_factory allows use of custom http clients
     * @return a pointer to the wallet instance
     */
    static monero_wallet_core* create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key, const monero_rpc_connection& daemon_connection = monero_rpc_connection(), uint64_t restore_height = 0, const string& language = "English", unique_ptr<epee::net_utils::http::http_client_factory> http_client_factory = nullptr);

    /**
     * Get a list of available languages for the wallet's mnemonic phrase.
     *
     * @return the available languages for the wallet's mnemonic phrase
     */
    static vector<string> get_mnemonic_languages();

    // ----------------------------- WALLET METHODS -----------------------------

    /**
     * Destruct the wallet.
     */
    ~monero_wallet_core();

    /**
     * Supported wallet methods.
     */
    bool is_watch_only() const { return m_w2->watch_only(); }
    void set_daemon_connection(const string& uri, const string& username = "", const string& password = "");
    void set_daemon_connection(const boost::optional<monero_rpc_connection>& connection);
    boost::optional<monero_rpc_connection> get_daemon_connection() const;
    bool is_connected() const;
    bool is_daemon_synced() const;
    bool is_daemon_trusted() const;
    bool is_synced() const;
    monero_version get_version() const;
    string get_path() const;
    monero_network_type get_network_type() const;
    string get_mnemonic() const;
    string get_mnemonic_language() const;
    string get_public_view_key() const;
    string get_private_view_key() const;
    string get_public_spend_key() const;
    string get_private_spend_key() const;
    string get_address(const uint32_t account_idx, const uint32_t subaddress_idx) const;
    monero_subaddress get_address_index(const string& address) const;
    monero_integrated_address get_integrated_address(const string& standard_address = "", const string& payment_id = "") const;
    monero_integrated_address decode_integrated_address(const string& integrated_address) const;
    uint64_t get_height() const;
    uint64_t get_restore_height() const;
    void set_restore_height(uint64_t restore_height);
    uint64_t get_daemon_height() const;
    uint64_t get_daemon_max_peer_height() const;
    void add_listener(monero_wallet_listener& listener);
    void remove_listener(monero_wallet_listener& listener);
    set<monero_wallet_listener*> get_listeners();
    monero_sync_result sync();
    monero_sync_result sync(monero_sync_listener& listener);
    monero_sync_result sync(uint64_t start_height);
    monero_sync_result sync(uint64_t start_height, monero_sync_listener& listener);
    void start_syncing();
    void stop_syncing();
    void rescan_spent();
    void rescan_blockchain();
    uint64_t get_balance() const;
    uint64_t get_balance(uint32_t account_idx) const;
    uint64_t get_balance(uint32_t account_idx, uint32_t subaddress_idx) const;
    uint64_t get_unlocked_balance() const;
    uint64_t get_unlocked_balance(uint32_t account_idx) const;
    uint64_t get_unlocked_balance(uint32_t account_idx, uint32_t subaddress_idx) const;
    vector<monero_account> get_accounts(bool include_subaddresses, const string& tag) const;
    monero_account get_account(const uint32_t account_idx, bool include_subaddresses) const;
    monero_account create_account(const string& label = "");
    vector<monero_subaddress> get_subaddresses(const uint32_t account_idx, const vector<uint32_t>& subaddress_indices) const;
    monero_subaddress create_subaddress(uint32_t account_idx, const string& label = "");
    vector<shared_ptr<monero_tx_wallet>> get_txs() const;
    vector<shared_ptr<monero_tx_wallet>> get_txs(const monero_tx_query& query) const;
    vector<shared_ptr<monero_tx_wallet>> get_txs(const monero_tx_query& query, vector<string>& missing_tx_hashes) const;
    vector<shared_ptr<monero_transfer>> get_transfers(const monero_transfer_query& query) const;
    vector<shared_ptr<monero_output_wallet>> get_outputs(const monero_output_query& query) const;
    string get_outputs_hex() const;
    int import_outputs_hex(const string& outputs_hex);
    vector<shared_ptr<monero_key_image>> get_key_images() const;
    shared_ptr<monero_key_image_import_result> import_key_images(const vector<shared_ptr<monero_key_image>>& key_images);
    monero_tx_set create_tx(monero_send_request& request);
    monero_tx_set create_tx(uint32_t account_index, string address, uint64_t amount);
    monero_tx_set create_tx(int account_index, string address, uint64_t amount, monero_send_priority priority);
    monero_tx_set create_txs(monero_send_request& request);
    string relay_tx(const string& tx_metadata);
    string relay_tx(const monero_tx_wallet& tx);
    vector<string> relay_txs(const vector<string>& tx_metadatas);
    vector<string> relay_txs(const vector<shared_ptr<monero_tx_wallet>>& txs);
    monero_tx_set send(const monero_send_request& request);
    monero_tx_set send(uint32_t account_index, string address, uint64_t amount);
    monero_tx_set send(uint32_t account_index, string address, uint64_t amount, monero_send_priority priority);
    monero_tx_set send_split(const monero_send_request& request);
    vector<monero_tx_set> sweep_unlocked(const monero_send_request& request);
    monero_tx_set sweep_output(const monero_send_request& request);
    monero_tx_set sweep_dust(bool do_not_relay = false);
    monero_tx_set parse_tx_set(const monero_tx_set& tx_set);
    string sign_txs(const string& unsigned_tx_hex);
    vector<string> submit_txs(const string& signed_tx_hex);
    string sign(const string& msg) const;
    bool verify(const string& msg, const string& address, const string& signature) const;
    string get_tx_key(const string& tx_hash) const;
    shared_ptr<monero_check_tx> check_tx_key(const string& tx_hash, const string& txKey, const string& address) const;
    string get_tx_proof(const string& tx_hash, const string& address, const string& message) const;
    shared_ptr<monero_check_tx> check_tx_proof(const string& tx_hash, const string& address, const string& message, const string& signature) const;
    string get_spend_proof(const string& tx_hash, const string& message) const;
    bool check_spend_proof(const string& tx_hash, const string& message, const string& signature) const;
    string get_reserve_proof_wallet(const string& message) const;
    string get_reserve_proof_account(uint32_t account_idx, uint64_t amount, const string& message) const;
    shared_ptr<monero_check_reserve> check_reserve_proof(const string& address, const string& message, const string& signature) const;
    string get_tx_note(const string& tx_hash) const;
    vector<string> get_tx_notes(const vector<string>& tx_hashes) const;
    void set_tx_note(const string& tx_hash, const string& note);
    void set_tx_notes(const vector<string>& tx_hashes, const vector<string>& notes);
    vector<monero_address_book_entry> get_address_book_entries(const vector<uint64_t>& indices) const;
    uint64_t add_address_book_entry(const string& address, const string& description);
    void edit_address_book_entry(uint64_t index, bool set_address, const string& address, bool set_description, const string& description);
    void delete_address_book_entry(uint64_t index);
    string create_payment_uri(const monero_send_request& request) const;
    shared_ptr<monero_send_request> parse_payment_uri(const string& uri) const;
    bool get_attribute(const string& key, string& value) const;
    void set_attribute(const string& key, const string& val);
    void start_mining(boost::optional<uint64_t> num_threads, boost::optional<bool> background_mining, boost::optional<bool> ignore_battery);
    void stop_mining();
    uint64_t wait_for_next_block();
    bool is_multisig_import_needed() const;
    monero_multisig_info get_multisig_info();
    string prepare_multisig();
    monero_multisig_init_result make_multisig(const vector<string>& multisig_hexes, int threshold, const string& password);
    monero_multisig_init_result exchange_multisig_keys(const vector<string>& mutisig_hexes, const string& password);
    string get_multisig_hex();
    int import_multisig_hex(const vector<string>& multisig_hexes);
    monero_multisig_sign_result sign_multisig_tx_hex(const string& multisig_tx_hex);
    vector<string> submit_multisig_tx_hex(const string& signed_multisig_tx_hex);
    void save();
    void move_to(string path, string password);
    void close(bool save = false);

    /**
     * Wallet import and export using buffers and not the file system.
     */
    std::string get_keys_file_buffer(const epee::wipeable_string& password, bool watch_only) const;
    std::string get_cache_file_buffer(const epee::wipeable_string& password) const;

    // --------------------------------- PRIVATE --------------------------------

  private:
    friend struct wallet2_listener;
    unique_ptr<tools::wallet2> m_w2;            // internal wallet implementation
    unique_ptr<wallet2_listener> m_w2_listener; // internal wallet implementation listener
    set<monero_wallet_listener*> m_listeners;   // external wallet listeners

    void init_common();
    vector<monero_subaddress> get_subaddresses_aux(uint32_t account_idx, const vector<uint32_t>& subaddress_indices, const vector<tools::wallet2::transfer_details>& transfers) const;
    monero_tx_set sweep_account(const monero_send_request& request);  // sweeps unlocked funds within an account; private helper to sweep_unlocked()

    // blockchain sync management
    mutable std::atomic<bool> m_is_synced;       // whether or not wallet is synced
    mutable std::atomic<bool> m_is_connected;    // cache connection status to avoid unecessary RPC calls
    boost::condition_variable m_sync_cv;         // to make sync threads woke
    boost::mutex m_sync_mutex;                   // synchronize sync() and syncAsync() requests
    std::atomic<bool> m_rescan_on_sync;          // whether or not to rescan on sync
    std::atomic<bool> m_syncing_enabled;         // whether or not auto sync is enabled
    std::atomic<int> m_syncing_interval;         // auto sync loop interval in milliseconds
    boost::thread m_syncing_thread;              // thread for auto sync loop
    boost::mutex m_syncing_mutex;                // synchronize auto sync loop
    std::atomic<bool> m_syncing_thread_done;     // whether or not the syncing thread is shut down
    void sync_thread_func();                     // function to run thread with syncing loop
    monero_sync_result lock_and_sync(boost::optional<uint64_t> start_height = boost::none);  // internal function to synchronize request to sync and rescan
    monero_sync_result sync_aux(boost::optional<uint64_t> start_height = boost::none);       // internal function to immediately block, sync, and report progress
  };
}
