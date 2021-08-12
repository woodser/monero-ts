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

#include "monero_wallet.h"
#include "wallet/wallet2.h"

#include <boost/thread/mutex.hpp>
#include <boost/thread/thread.hpp>
#include <boost/thread/condition_variable.hpp>

/**
 * Implements a monero_wallet.h by wrapping monero-project's wallet2.
 */
namespace monero {

  // -------------------------------- LISTENERS -------------------------------

  // forward declaration of internal wallet2 listener
  struct wallet2_listener;

  // --------------------------- STATIC WALLET UTILS --------------------------

  /**
   * Monero wallet implementation which uses monero-project's wallet2.
   */
  class monero_wallet_full : public monero_wallet {

  public:

    /**
     * Indicates if a wallet exists at the given path.
     *
     * @param path is the path to check for a wallet
     * @return true if a wallet exists at the given path, false otherwise
     */
    static bool wallet_exists(const std::string& path);

    /**
     * Open an existing wallet from disk.
     *
     * @param path is the path to the wallet file to open
     * @param password is the password of the wallet file to open
     * @param network_type is the wallet's network type
     * @return a pointer to the wallet instance
     */
    static monero_wallet_full* open_wallet(const std::string& path, const std::string& password, const monero_network_type network_type);

    /**
     * Open an in-memory wallet from existing data buffers.
     *
     * @param password is the password of the wallet file to open
     * @param network_type is the wallet's network type
     * @param keys_data contains the contents of the ".keys" file
     * @param cache_data contains the contents of the wallet cache file (no extension)
     * @param daemon_connection is connection information to a daemon (default = an unconnected wallet)
     * @param http_client_factory allows use of custom http clients
     * @return a pointer to the wallet instance
     */
    static monero_wallet_full* open_wallet_data(const std::string& password, const monero_network_type, const std::string& keys_data, const std::string& cache_data, const monero_rpc_connection& daemon_connection = monero_rpc_connection(), std::unique_ptr<epee::net_utils::http::http_client_factory> http_client_factory = nullptr);

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
    static monero_wallet_full* create_wallet_random(const std::string& path, const std::string& password, const monero_network_type network_type, const monero_rpc_connection& daemon_connection = monero_rpc_connection(), const std::string& language = "English", std::unique_ptr<epee::net_utils::http::http_client_factory> http_client_factory = nullptr);

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
    static monero_wallet_full* create_wallet_from_mnemonic(const std::string& path, const std::string& password, const monero_network_type network_type, const std::string& mnemonic, const monero_rpc_connection& daemon_connection = monero_rpc_connection(), uint64_t restore_height = 0, const std::string& seed_offset = "", std::unique_ptr<epee::net_utils::http::http_client_factory> http_client_factory = nullptr);

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
    static monero_wallet_full* create_wallet_from_keys(const std::string& path, const std::string& password, const monero_network_type network_type, const std::string& address, const std::string& view_key, const std::string& spend_key, const monero_rpc_connection& daemon_connection = monero_rpc_connection(), uint64_t restore_height = 0, const std::string& language = "English", std::unique_ptr<epee::net_utils::http::http_client_factory> http_client_factory = nullptr);

    /**
     * Get a list of available languages for the wallet's mnemonic phrase.
     *
     * @return the available languages for the wallet's mnemonic phrase
     */
    static std::vector<std::string> get_mnemonic_languages();

    // ----------------------------- WALLET METHODS -----------------------------

    /**
     * Destruct the wallet.
     */
    ~monero_wallet_full();

    /**
     * Supported wallet methods.
     */
    bool is_view_only() const override { return m_w2->watch_only(); }
    void set_daemon_connection(const std::string& uri, const std::string& username = "", const std::string& password = "") override;
    void set_daemon_connection(const boost::optional<monero_rpc_connection>& connection) override;
    boost::optional<monero_rpc_connection> get_daemon_connection() const override;
    bool is_connected() const override;
    bool is_daemon_synced() const override;
    bool is_daemon_trusted() const override;
    bool is_synced() const override;
    monero_version get_version() const override;
    std::string get_path() const override;
    monero_network_type get_network_type() const override;
    std::string get_mnemonic() const override;
    std::string get_mnemonic_language() const override;
    std::string get_public_view_key() const override;
    std::string get_private_view_key() const override;
    std::string get_public_spend_key() const override;
    std::string get_private_spend_key() const override;
    std::string get_address(const uint32_t account_idx, const uint32_t subaddress_idx) const override;
    monero_subaddress get_address_index(const std::string& address) const override;
    monero_integrated_address get_integrated_address(const std::string& standard_address = "", const std::string& payment_id = "") const override;
    monero_integrated_address decode_integrated_address(const std::string& integrated_address) const override;
    uint64_t get_height() const override;
    uint64_t get_sync_height() const override;
    void set_sync_height(uint64_t sync_height) override;
    uint64_t get_daemon_height() const override;
    uint64_t get_daemon_max_peer_height() const override;
    uint64_t get_height_by_date(uint16_t year, uint8_t month, uint8_t day) const override;
    void add_listener(monero_wallet_listener& listener) override;
    void remove_listener(monero_wallet_listener& listener) override;
    std::set<monero_wallet_listener*> get_listeners() override;
    monero_sync_result sync() override;
    monero_sync_result sync(monero_wallet_listener& listener) override;
    monero_sync_result sync(uint64_t start_height) override;
    monero_sync_result sync(uint64_t start_height, monero_wallet_listener& listener) override;
    void start_syncing(uint64_t sync_period_in_ms) override;
    void stop_syncing() override;
    void rescan_spent() override;
    void rescan_blockchain() override;
    uint64_t get_balance() const override;
    uint64_t get_balance(uint32_t account_idx) const override;
    uint64_t get_balance(uint32_t account_idx, uint32_t subaddress_idx) const override;
    uint64_t get_unlocked_balance() const override;
    uint64_t get_unlocked_balance(uint32_t account_idx) const override;
    uint64_t get_unlocked_balance(uint32_t account_idx, uint32_t subaddress_idx) const override;
    std::vector<monero_account> get_accounts(bool include_subaddresses, const std::string& tag) const override;
    monero_account get_account(const uint32_t account_idx, bool include_subaddresses) const override;
    monero_account create_account(const std::string& label = "") override;
    std::vector<monero_subaddress> get_subaddresses(const uint32_t account_idx, const std::vector<uint32_t>& subaddress_indices) const override;
    monero_subaddress create_subaddress(uint32_t account_idx, const std::string& label = "") override;
    std::vector<std::shared_ptr<monero_tx_wallet>> get_txs() const override;
    std::vector<std::shared_ptr<monero_tx_wallet>> get_txs(const monero_tx_query& query) const override;
    std::vector<std::shared_ptr<monero_tx_wallet>> get_txs(const monero_tx_query& query, std::vector<std::string>& missing_tx_hashes) const override;
    std::vector<std::shared_ptr<monero_transfer>> get_transfers(const monero_transfer_query& query) const override;
    std::vector<std::shared_ptr<monero_output_wallet>> get_outputs(const monero_output_query& query) const override;
    std::string export_outputs(bool all = false) const override;
    int import_outputs(const std::string& outputs_hex) override;
    std::vector<std::shared_ptr<monero_key_image>> export_key_images(bool all = false) const override;
    std::shared_ptr<monero_key_image_import_result> import_key_images(const std::vector<std::shared_ptr<monero_key_image>>& key_images) override;
    void freeze_output(const std::string& key_image) override;
    void thaw_output(const std::string& key_image) override;
    bool is_output_frozen(const std::string& key_image) override;
    std::vector<std::shared_ptr<monero_tx_wallet>> create_txs(const monero_tx_config& config) override;
    std::vector<std::shared_ptr<monero_tx_wallet>> sweep_unlocked(const monero_tx_config& config) override;
    std::shared_ptr<monero_tx_wallet> sweep_output(const monero_tx_config& config) override;
    std::vector<std::shared_ptr<monero_tx_wallet>> sweep_dust(bool relay = false) override;
    std::vector<std::string> relay_txs(const std::vector<std::string>& tx_metadatas) override;
    monero_tx_set describe_tx_set(const monero_tx_set& tx_set) override;
    std::string sign_txs(const std::string& unsigned_tx_hex) override;
    std::vector<std::string> submit_txs(const std::string& signed_tx_hex) override;
    std::string sign_message(const std::string& msg, monero_message_signature_type signature_type, uint32_t account_idx = 0, uint32_t subaddress_idx = 0) const override;
    monero_message_signature_result verify_message(const std::string& msg, const std::string& address, const std::string& signature) const override;
    std::string get_tx_key(const std::string& tx_hash) const override;
    std::shared_ptr<monero_check_tx> check_tx_key(const std::string& tx_hash, const std::string& txKey, const std::string& address) const override;
    std::string get_tx_proof(const std::string& tx_hash, const std::string& address, const std::string& message) const override;
    std::shared_ptr<monero_check_tx> check_tx_proof(const std::string& tx_hash, const std::string& address, const std::string& message, const std::string& signature) const override;
    std::string get_spend_proof(const std::string& tx_hash, const std::string& message) const override;
    bool check_spend_proof(const std::string& tx_hash, const std::string& message, const std::string& signature) const override;
    std::string get_reserve_proof_wallet(const std::string& message) const override;
    std::string get_reserve_proof_account(uint32_t account_idx, uint64_t amount, const std::string& message) const override;
    std::shared_ptr<monero_check_reserve> check_reserve_proof(const std::string& address, const std::string& message, const std::string& signature) const override;
    std::string get_tx_note(const std::string& tx_hash) const override;
    std::vector<std::string> get_tx_notes(const std::vector<std::string>& tx_hashes) const override;
    void set_tx_note(const std::string& tx_hash, const std::string& note) override;
    void set_tx_notes(const std::vector<std::string>& tx_hashes, const std::vector<std::string>& notes) override;
    std::vector<monero_address_book_entry> get_address_book_entries(const std::vector<uint64_t>& indices) const override;
    uint64_t add_address_book_entry(const std::string& address, const std::string& description) override;
    void edit_address_book_entry(uint64_t index, bool set_address, const std::string& address, bool set_description, const std::string& description) override;
    void delete_address_book_entry(uint64_t index) override;
    std::string create_payment_uri(const monero_tx_config& config) const override;
    std::shared_ptr<monero_tx_config> parse_payment_uri(const std::string& uri) const override;
    bool get_attribute(const std::string& key, std::string& value) const override;
    void set_attribute(const std::string& key, const std::string& val) override;
    void start_mining(boost::optional<uint64_t> num_threads, boost::optional<bool> background_mining, boost::optional<bool> ignore_battery) override;
    void stop_mining() override;
    uint64_t wait_for_next_block() override;
    bool is_multisig_import_needed() const override;
    monero_multisig_info get_multisig_info() const override;
    std::string prepare_multisig() override;
    monero_multisig_init_result make_multisig(const std::vector<std::string>& multisig_hexes, int threshold, const std::string& password) override;
    monero_multisig_init_result exchange_multisig_keys(const std::vector<std::string>& mutisig_hexes, const std::string& password) override;
    std::string get_multisig_hex() override;
    int import_multisig_hex(const std::vector<std::string>& multisig_hexes) override;
    monero_multisig_sign_result sign_multisig_tx_hex(const std::string& multisig_tx_hex) override;
    std::vector<std::string> submit_multisig_tx_hex(const std::string& signed_multisig_tx_hex) override;
    void save() override;
    void move_to(std::string path, std::string password) override;
    void close(bool save = false) override;

    /**
     * Wallet import and export using buffers and not the file system.
     */
    std::string get_keys_file_buffer(const epee::wipeable_string& password, bool view_only) const;
    std::string get_cache_file_buffer(const epee::wipeable_string& password) const;

    // --------------------------------- PRIVATE --------------------------------

  private:
    friend struct wallet2_listener;
    std::unique_ptr<tools::wallet2> m_w2;            // internal wallet implementation
    std::unique_ptr<wallet2_listener> m_w2_listener; // internal wallet implementation listener
    std::set<monero_wallet_listener*> m_listeners;   // external wallet listeners

    void init_common();
    std::vector<monero_subaddress> get_subaddresses_aux(uint32_t account_idx, const std::vector<uint32_t>& subaddress_indices, const std::vector<tools::wallet2::transfer_details>& transfers) const;
    std::vector<std::shared_ptr<monero_transfer>> get_transfers_aux(const monero_transfer_query& query) const;
    std::vector<std::shared_ptr<monero_output_wallet>> get_outputs_aux(const monero_output_query& query) const;
    std::vector<std::shared_ptr<monero_tx_wallet>> sweep_account(const monero_tx_config& config);  // sweeps unlocked funds within an account; private helper to sweep_unlocked()

    // blockchain sync management
    mutable std::atomic<bool> m_is_synced;       // whether or not wallet is synced
    mutable std::atomic<bool> m_is_connected;    // cache connection status to avoid unecessary RPC calls
    boost::condition_variable m_sync_cv;         // to make sync threads woke
    boost::mutex m_sync_mutex;                   // synchronize sync() and syncAsync() requests
    std::atomic<bool> m_rescan_on_sync;          // whether or not to rescan on sync
    std::atomic<bool> m_syncing_enabled;         // whether or not auto sync is enabled
    std::atomic<bool> m_sync_loop_running;       // whether or not the syncing thread is shut down
    std::atomic<int> m_syncing_interval;         // auto sync loop interval in milliseconds
    boost::thread m_syncing_thread;              // thread for auto sync loop
    boost::mutex m_syncing_mutex;                // synchronize auto sync loop
    void run_sync_loop();                        // run the sync loop in a thread
    monero_sync_result lock_and_sync(boost::optional<uint64_t> start_height = boost::none);  // internal function to synchronize request to sync and rescan
    monero_sync_result sync_aux(boost::optional<uint64_t> start_height = boost::none);       // internal function to immediately block, sync, and report progress
  };
}
