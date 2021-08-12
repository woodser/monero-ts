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

#include "monero_wallet_model.h"
#include <vector>
#include <set>

using namespace monero;

/**
 * Public library interface.
 */
namespace monero {

  // --------------------------------- LISTENERS ------------------------------

  /**
   * Interface to receive wallet notifications.
   */
  class monero_wallet_listener {
  public:

    /**
     * Invoked when sync progress is made.
     *
     * @param height - height of the synced block
     * @param start_height - starting height of the sync request
     * @param end_height - ending height of the sync request
     * @param percent_done - sync progress as a percentage
     * @param message - human-readable description of the current progress
     */
    virtual void on_sync_progress(uint64_t height, uint64_t start_height, uint64_t end_height, double percent_done, const std::string& message) {}

    /**
     * Invoked when a new block is processed.
     *
     * @param block - the newly processed block
     */
    virtual void on_new_block(uint64_t height) {};

    /**
     * Invoked when the wallet's balances change.
     *
     * @param new_balance - new balance
     * @param new_unlocked_balance - new unlocked balance
     */
    virtual void on_balances_changed(uint64_t new_balance, uint64_t new_unlocked_balance) {};

    /**
     * Invoked when the wallet receives an output.
     *
     * @param output - the received output
     */
    virtual void on_output_received(const monero_output_wallet& output) {};

    /**
     * Invoked when the wallet spends an output.
     *
     * @param output - the spent output
     */
    virtual void on_output_spent(const monero_output_wallet& output) {};
  };

  // forward declaration of internal wallet2 listener
  struct wallet2_listener;

  // ----------------------------- WALLET METHODS -----------------------------

  /**
   * Base wallet with default implementations.
   */
  class monero_wallet {

  public:

    /**
     * Virtual destructor.
     */
    virtual ~monero_wallet() {}

    /**
     * Indicates if the wallet is view-only, meaning it does have the private
     * spend key and can therefore only observe incoming outputs.
     *
     * @return true if the wallet is view-only, false otherwise
     */
    virtual bool is_view_only() const {
      throw std::runtime_error("is_view_only() not supported");
    }

    /**
     * Set the wallet's daemon connection.
     *
     * @param uri is the daemon's URI
     * @param username is the username to authenticate with the daemon (optional)
     * @param password is the password to authenticate with the daemon (optional)
     */
    virtual void set_daemon_connection(const std::string& uri, const std::string& username = "", const std::string& password = "") {
      throw std::runtime_error("set_daemon_connection() not supported");
    }

    /**
     * Set the wallet's daemon connection.
     *
     * @param connection is the connection to set
     */
    virtual void set_daemon_connection(const boost::optional<monero_rpc_connection>& connection) {
      throw std::runtime_error("set_daemon_connection() not supported");
    }

    /**
     * Get the wallet's daemon connection.
     *
     * @return the wallet's daemon connection
     */
    virtual boost::optional<monero_rpc_connection> get_daemon_connection() const {
      throw std::runtime_error("get_daemon_connection() not supported");
    }

    /**
     * Indicates if the wallet is connected a daemon.
     *
     * @return true if the wallet is connected to a daemon, false otherwise
     */
    virtual bool is_connected() const {
      throw std::runtime_error("is_connected() not supported");
    }

    /**
     * Indicates if the wallet's daemon is synced with the network.
     *
     * @return true if the daemon is synced with the network, false otherwise
     */
    virtual bool is_daemon_synced() const {
      throw std::runtime_error("is_daemon_synced() not supported");
    }

    /**
     * Indicates if the daemon is trusted or untrusted.
     *
     * @return true if the daemon is trusted, false otherwise
     */
    virtual bool is_daemon_trusted() const {
      throw std::runtime_error("is_daemon_trusted() not supported");
    }

    /**
     * Indicates if the wallet is synced with the daemon.
     *
     * @return true if the wallet is synced with the daemon, false otherwise
     */
    virtual bool is_synced() const {
      throw std::runtime_error("is_synced() not supported");
    }

    /**
     * Get the wallet's version.
     *
     * @return the wallet's version
     */
    virtual monero_version get_version() const {
      throw std::runtime_error("get_version() not supported");
    }

    /**
     * Get the path of this wallet's file on disk.
     *
     * @return the path of this wallet's file on disk
     */
    virtual std::string get_path() const {
      throw std::runtime_error("get_path() not supported");
    }

    /**
     * Get the wallet's network type (mainnet, testnet, or stagenet).
     *
     * @return the wallet's network type
     */
    virtual monero_network_type get_network_type() const {
      throw std::runtime_error("get_network_type() not supported");
    }

    /**
     * Get the wallet's mnemonic phrase.
     *
     * @param mnemonic is assigned the wallet's mnemonic phrase
     */
    virtual std::string get_mnemonic() const {
      throw std::runtime_error("get_mnemonic() not supported");
    }

    /**
     * Get the language of the wallet's mnemonic phrase.
     *
     * @return the language of the wallet's mnemonic phrase
     */
    virtual std::string get_mnemonic_language() const {
      throw std::runtime_error("get_mnemonic_language() not supported");
    }

    /**
     * Get the wallet's public view key.
     *
     * @return the wallet's public view key
     */
    virtual std::string get_public_view_key() const {
      throw std::runtime_error("get_public_view_key() not supported");
    }

    /**
     * Get the wallet's private view key.
     *
     * @return the wallet's private view key
     */
    virtual std::string get_private_view_key() const {
      throw std::runtime_error("get_private_view_key() not supported");
    }

    /**
     * Get the wallet's public spend key.
     *
     * @return the wallet's public spend key
     */
    virtual std::string get_public_spend_key() const {
      throw std::runtime_error("get_public_spend_key() not supported");
    }

    /**
     * Get the wallet's private spend key.
     *
     * @return the wallet's private spend key
     */
    virtual std::string get_private_spend_key() const {
      throw std::runtime_error("get_private_spend_key() not supported");
    }

    /**
     * Get the wallet's primary address.
     *
     * @return the wallet's primary address
     */
    virtual std::string get_primary_address() const {
      return get_address(0, 0);
    }

    /**
     * Get the address of a specific subaddress.
     *
     * @param account_idx specifies the account index of the address's subaddress
     * @param subaddress_idx specifies the subaddress index within the account
     * @return the receive address of the specified subaddress
     */
    virtual std::string get_address(const uint32_t account_idx, const uint32_t subaddress_idx) const {
      throw std::runtime_error("get_address() not supported");
    }

    /**
     * Get the account and subaddress index of the given address.
     *
     * @param address is the address to get the account and subaddress index from
     * @return the account and subaddress indices
     * @throws exception if address is not a wallet address
     */
    virtual monero_subaddress get_address_index(const std::string& address) const {
      throw std::runtime_error("get_address_index() not supported");
    }

    /**
     * Get an integrated address from a standard address and a payment id.
     *
     * @param standard_address is the integrated addresse's standard address (defaults to wallet's primary address)
     * @param payment_id is the integrated addresse's payment id (defaults to randomly generating new payment id)
     * @return the integrated address
     */
    virtual monero_integrated_address get_integrated_address(const std::string& standard_address = "", const std::string& payment_id = "") const {
      throw std::runtime_error("get_integrated_address() not supported");
    }

    /**
     * Decode an integrated address to get its standard address and payment id.
     *
     * @param integrated_address is an integrated address to decode
     * @return the decoded integrated address including standard address and payment id
     */
    virtual monero_integrated_address decode_integrated_address(const std::string& integrated_address) const {
      throw std::runtime_error("decode_integrated_address() not supported");
    }

    /**
     * Get the height of the last block processed by the wallet (its index + 1).
     *
     * @return the height of the last block processed by the wallet
     */
    virtual uint64_t get_height() const {
      throw std::runtime_error("get_height() not supported");
    }

    /**
     * Get the height of the first block that the wallet scans.
     *
     * @return the height of the first block that the wallet scans
     */
    virtual uint64_t get_sync_height() const {
      throw std::runtime_error("get_sync_height() not supported");
    }

    /**
     * Set the height of the first block that the wallet scans.
     *
     * @param sync_height is the height of the first block that the wallet scans
     */
    virtual void set_sync_height(uint64_t sync_height) {
      throw std::runtime_error("set_sync_height() not supported");
    }

    /**
     * Get the height that the wallet's daemon is synced to.
     *
     * @return the height that the wallet's daemon is synced to
     */
    virtual uint64_t get_daemon_height() const {
      throw std::runtime_error("get_daemon_height() not supported");
    }

    /**
     * Get the maximum height of the peers the wallet's daemon is connected to.
     *
     * @return the maximum height of the peers the wallet's daemon is connected to
     */
    virtual uint64_t get_daemon_max_peer_height() const {
      throw std::runtime_error("get_daemon_max_peer_height() not supported");
    }
    
    /**
     * Get the blockchain's height by date as a conservative estimate for scanning.
     * 
     * @param year - year of the height to get
     * @param month - month of the height to get as a number between 1 and 12
     * @param day - day of the height to get as a number between 1 and 31
     * @return the blockchain's approximate height at the given date
     */
    virtual uint64_t get_height_by_date(uint16_t year, uint8_t month, uint8_t day) const {
      throw std::runtime_error("get_height_by_date(year, month, day) not supported");
    }

    /**
     * Register a listener receive wallet notifications.
     *
     * @param listener is the listener to receive wallet notifications
     */
    virtual void add_listener(monero_wallet_listener& listener) {
      throw std::runtime_error("add_listener() not supported");
    }

    /**
     * Unregister a listener to receive wallet notifications.
     *
     * @param listener is the listener to unregister
     */
    virtual void remove_listener(monero_wallet_listener& listener) {
      throw std::runtime_error("remove_listener() not supported");
    }

    /**
     * Get the listeners registered with the wallet.
     */
    virtual std::set<monero_wallet_listener*> get_listeners() {
      throw std::runtime_error("get_listeners() not supported");
    }

    /**
     * Synchronize the wallet with the daemon as a one-time synchronous process.
     *
     * @return the sync result
     */
    virtual monero_sync_result sync() {
      throw std::runtime_error("sync() not supported");
    }

    /**
     * Synchronize the wallet with the daemon as a one-time synchronous process.
     *
     * @param listener - listener to receive notifications during synchronization
     * @return the sync result
     */
    virtual monero_sync_result sync(monero_wallet_listener& listener) {
      throw std::runtime_error("sync() not supported");
    }

    /**
     * Synchronize the wallet with the daemon as a one-time synchronous process.
     *
     * @param start_height is the start height to sync from (ignored if less than last processed block)
     * @return the sync result
     */
    virtual monero_sync_result sync(uint64_t start_height) {
      throw std::runtime_error("sync() not supported");
    }

    /**
     * Synchronizes the wallet with the blockchain.
     *
     * @param start_height - start height to sync from (ignored if less than last processed block)
     * @param listener - listener to receive notifications during synchronization
     * @return the sync result
     */
    virtual monero_sync_result sync(uint64_t start_height, monero_wallet_listener& listener) {
      throw std::runtime_error("sync() not supported");
    }

    /**
     * Start background synchronizing with a maximum period between syncs.
     *
     * @param syncPeriodInMs - maximum period between syncs in milliseconds
     */
    virtual void start_syncing(uint64_t sync_period_in_ms = 10000) {
      throw std::runtime_error("start_syncing() not supported");
    }

    /**
     * Stop the asynchronous thread to continuously synchronize the wallet with the daemon.
     */
    virtual void stop_syncing() {
      throw std::runtime_error("stop_syncing() not supported");
    }

    /**
     * Rescan the blockchain for spent outputs.
     *
     * Note: this can only be called with a trusted daemon.
     *
     * Example use case: peer multisig hex is import when connected to an untrusted daemon,
     * so the wallet will not rescan spent outputs.  Then the wallet connects to a trusted
     * daemon.  This method should be manually invoked to rescan outputs.
     */
    virtual void rescan_spent() {
      throw std::runtime_error("rescan_spent() not supported");
    }

    /**
     * Rescan the blockchain from scratch, losing any information which cannot be recovered from
     * the blockchain itself.
     *
     * WARNING: This method discards local wallet data like destination addresses, tx secret keys,
     * tx notes, etc.
     */
    virtual void rescan_blockchain() {
      throw std::runtime_error("rescan_blockchain() not supported");
    }

    /**
     * Get the wallet's balance.
     *
     * @return the wallet's balance
     */
    virtual uint64_t get_balance() const {
      throw std::runtime_error("get_balance() not supported");
    }

    /**
     * Get an account's balance.
     *
     * @param account_idx is the index of the account to get the balance of
     * @return the account's balance
     */
    virtual uint64_t get_balance(uint32_t account_idx) const {
      throw std::runtime_error("get_balance() not supported");
    }

    /**
     * Get a subaddress's balance.
     *
     * @param account_idx is the index of the subaddress's account to get the balance of
     * @param subaddress_idx is the index of the subaddress to get the balance of
     * @return the subaddress's balance
     */
    virtual uint64_t get_balance(uint32_t account_idx, uint32_t subaddress_idx) const {
      throw std::runtime_error("get_balance() not supported");
    }

    /**
     * Get the wallet's unlocked balance.
     *
     * @return the wallet's unlocked balance
     */
    virtual uint64_t get_unlocked_balance() const {
      throw std::runtime_error("get_unlocked_balance() not supported");
    }

    /**
     * Get an account's unlocked balance.
     *
     * @param account_idx is the index of the account to get the unlocked balance of
     * @return the account's unlocked balance
     */
    virtual uint64_t get_unlocked_balance(uint32_t account_idx) const {
      throw std::runtime_error("get_unlocked_balance() not supported");
    }

    /**
     * Get a subaddress's unlocked balance.
     *
     * @param account_idx is the index of the subaddress's account to get the unlocked balance of
     * @param subaddress_idx is the index of the subaddress to get the unlocked balance of
     * @return the subaddress's balance
     */
    virtual uint64_t get_unlocked_balance(uint32_t account_idx, uint32_t subaddress_idx) const {
      throw std::runtime_error("get_unlocked_balance() not supported");
    }

    /**
     * Get all accounts.
     *
     * @return List<monero_account> are all accounts within the wallet
     */
    virtual std::vector<monero_account> get_accounts() const {
      return get_accounts(false, std::string(""));
    }

    /**
     * Get all accounts.
     *
     * @param include_subaddresses specifies if subaddresses should be included
     * @return List<monero_account> are all accounts
     */
    virtual std::vector<monero_account> get_accounts(bool include_subaddresses) const {
      return get_accounts(include_subaddresses, "");
    }

    /**
     * Get accounts with a given tag.
     *
     * @param tag is the tag for filtering accounts, all accounts if null
     * @return List<monero_account> are all accounts for the wallet with the given tag
     */
    virtual std::vector<monero_account> get_accounts(const std::string& tag) const {
      return get_accounts(false, tag);
    }

    /**
     * Get accounts with a given tag.
     *
     * @param include_subaddresses specifies if subaddresses should be included
     * @param tag is the tag for filtering accounts, all accounts if null
     * @return List<monero_account> are all accounts for the wallet with the given tag
     */
    virtual std::vector<monero_account> get_accounts(bool include_subaddresses, const std::string& tag) const {
      throw std::runtime_error("get_accounts() not supported");
    }

    /**
     * Get an account without subaddress information.
     *
     * @param account_idx specifies the account to get
     * @return the retrieved account
     */
    virtual monero_account get_account(uint32_t account_idx) const {
      return get_account(account_idx, false);
    }

    /**
     * Get an account.
     *
     * @param account_idx specifies the account to get
     * @param include_subaddresses specifies if subaddresses should be included
     * @return the retrieved account
     */
    virtual monero_account get_account(const uint32_t account_idx, bool include_subaddresses) const {
      throw std::runtime_error("get_account() not supported");
    }

    /**
     * Create a new account with a label for the first subaddress.
     *
     * @param label specifies the label for the account's first subaddress (optional)
     * @return the created account
     */
    virtual monero_account create_account(const std::string& label = "") {
      throw std::runtime_error("create_account() not supported");
    }

    /**
     * Get all subaddresses in an account.
     *
     * @param account_idx specifies the account to get subaddresses within
     * @return List<monero_subaddress> are the retrieved subaddresses
     */
    virtual std::vector<monero_subaddress> get_subaddresses(const uint32_t account_idx) const {
      return get_subaddresses(account_idx, std::vector<uint32_t>());
    }

    /**
     * Get subaddresses in an account.
     *
     * @param account_idx specifies the account to get subaddresses within
     * @param subaddress_indices are specific subaddresses to get (optional)
     * @return the retrieved subaddresses
     */
    virtual std::vector<monero_subaddress> get_subaddresses(const uint32_t account_idx, const std::vector<uint32_t>& subaddress_indices) const {
      throw std::runtime_error("get_subaddresses() not supported");
    }

    /**
     * Get a subaddress.
     *
     * @param account_idx specifies the index of the subaddress's account
     * @param subaddress_idx specifies index of the subaddress within the account
     * @return the retrieved subaddress
     */
    virtual monero_subaddress get_subaddress(const uint32_t account_idx, const uint32_t subaddress_idx) const {
      throw std::runtime_error("get_subaddress() not supported");
    }

    /**
     * Create a subaddress within an account.
     *
     * @param account_idx specifies the index of the account to create the subaddress within
     * @param label specifies the the label for the subaddress (defaults to empty std::string)
     * @return the created subaddress
     */
    virtual monero_subaddress create_subaddress(uint32_t account_idx, const std::string& label = "") {
      throw std::runtime_error("create_subaddress() not supported");
    }

    /**
     * Get all wallet transactions.  Wallet transactions contain one or more
     * transfers that are either incoming or outgoing to the wallet.
     *
     * @return all wallet transactions
     */
    virtual std::vector<std::shared_ptr<monero_tx_wallet>> get_txs() const {
      throw std::runtime_error("get_txs() not supported");
    }

    /**
     * Get wallet transactions.  Wallet transactions contain one or more
     * transfers that are either incoming or outgoing to the wallet.
     *
     * Query results can be filtered by passing in a transaction query.
     * Transactions must meet every criteria defined in the query in order to
     * be returned.  All filtering is optional and no filtering is applied when
     * not defined.
     *
     * @param query filters query results (optional)
     * @return wallet transactions per the query
     */
    virtual std::vector<std::shared_ptr<monero_tx_wallet>> get_txs(const monero_tx_query& query) const {
      throw std::runtime_error("get_txs(query) not supported");
    }

    /**
     * Same as get_txs(query) but collects missing tx hashes instead of throwing an error.
     * This method is separated because WebAssembly does not support exception handling.
     *
     * @param query filters results (optional)
     * @param missing_tx_hashes are populated with requested tx hashes that are not part of the wallet
     * @return wallet transactions per the request
     */
    virtual std::vector<std::shared_ptr<monero_tx_wallet>> get_txs(const monero_tx_query& query, std::vector<std::string>& missing_tx_hashes) const {
      throw std::runtime_error("get_txs(query, missing_tx_hashes) not supported");
    }

    /**
     * Get incoming and outgoing transfers to and from this wallet.  An outgoing
     * transfer represents a total amount sent from one or more subaddresses
     * within an account to individual destination addresses, each with their
     * own amount.  An incoming transfer represents a total amount received into
     * a subaddress within an account.  Transfers belong to transactions which
     * are stored on the blockchain.
     *
     * Query results can be filtered by passing in a monero_transfer_query.
     * Transfers must meet every criteria defined in the query in order to be
     * returned.  All filtering is optional and no filtering is applied when not
     * defined.
     *
     * @param query filters query results (optional)
     * @return wallet transfers per the query
     */
    virtual std::vector<std::shared_ptr<monero_transfer>> get_transfers(const monero_transfer_query& query) const {
      throw std::runtime_error("get_transfers() not supported");
    }

    /**
     * Get outputs created from previous transactions that belong to the wallet
     * (i.e. that the wallet can spend one time).  Outputs are part of
     * transactions which are stored in blocks on the blockchain.
     *
     * Results can be configured by passing a monero_output_query.  Outputs must
     * meet every criteria defined in the query in order to be returned.  All
     * filtering is optional and no filtering is applied when not defined.
     *
     * @param query specifies query options (optional)
     * @return wallet outputs per the query
     */
    virtual std::vector<std::shared_ptr<monero_output_wallet>> get_outputs(const monero_output_query& query) const {
      throw std::runtime_error("get_outputs() not supported");
    }

    /**
     * Export outputs in hex format.
     *
     * @param all - export all outputs if true, else export outputs since the last export
     * @return outputs in hex format, empty std::string if no outputs
     */
    virtual std::string export_outputs(bool all = false) const {
      throw std::runtime_error("export_outputs() not supported");
    }

    /**
     * Import outputs in hex format.
     *
     * @param outputs_hex are outputs in hex format
     * @return the number of outputs imported
     */
    virtual int import_outputs(const std::string& outputs_hex) {
      throw std::runtime_error("import_outputs() not supported");
    }

    /**
     * Export signed key images.
     *
     * @param all - export all key images if true, else export key images since the last export
     * @return the wallet's signed key images
     */
    virtual std::vector<std::shared_ptr<monero_key_image>> export_key_images(bool all = false) const {
      throw std::runtime_error("export_key_images() not supported");
    }

    /**
     * Import signed key images and verify their spent status.
     *
     * @param key_images are key images to import and verify (requires hex and signature)
     * @return results of the import
     */
    virtual std::shared_ptr<monero_key_image_import_result> import_key_images(const std::vector<std::shared_ptr<monero_key_image>>& key_images) {
      throw std::runtime_error("import_key_images() not supported");
    }

    /**
     * Freeze an output.
     *
     * @param key_image key image of the output to freeze
     */
    virtual void freeze_output(const std::string& key_image) {
      throw std::runtime_error("freeze_output() not supported");
    }

    /**
     * Thaw a frozen output.
     *
     * @param key_image key image of the output to thaw
     */
    virtual void thaw_output(const std::string& key_image) {
      throw std::runtime_error("thaw_output() not supported");
    }

    /**
     * Check if an output is frozen.
     *
     * @param key_image key image of the output to check if frozen
     * @return true if the output is frozen, false otherwise
     */
    virtual bool is_output_frozen(const std::string& key_image) {
      throw std::runtime_error("is_output_frozen() not supported");
    }

    /**
     * Create a transaction to transfer funds from this wallet.
     *
     * @param config configures the transaction to create
     * @return the created transaction
     */
    virtual std::shared_ptr<monero_tx_wallet> create_tx(const monero_tx_config& config) {
      if (config.m_can_split != boost::none && config.m_can_split.get()) throw std::runtime_error("Cannot split transactions with create_tx(); use create_txs() instead");
      monero_tx_config config_copy = monero_tx_config(config);
      config_copy.m_can_split = false;
      return create_txs(config_copy)[0];
    }

    /**
     * Create one or more transactions to transfer funds from this wallet.
     *
     * @param config configures the transactions to create
     * @return the created transactions
     */
    virtual std::vector<std::shared_ptr<monero_tx_wallet>> create_txs(const monero_tx_config& config) {
      throw std::runtime_error("create_txs() not supported");
    }

    /**
     * Sweep unlocked funds according to the given config.
     *
     * @param config is the sweep configuration
     * @return the created transactions
     */
    virtual std::vector<std::shared_ptr<monero_tx_wallet>> sweep_unlocked(const monero_tx_config& config) {
      throw std::runtime_error("sweep_unlocked() not supported");
    }

    /**
     * Sweep an output with a given key image.
     *
     * @param config configures the sweep transaction
     * @return the created transaction
     */
    virtual std::shared_ptr<monero_tx_wallet> sweep_output(const monero_tx_config& config) {
      throw std::runtime_error("sweep_output() not supported");
    }

    /**
     * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
     *
     * @param relay specifies if the resulting transaction should be relayed (default false)
     * @return the created transactions
     */
    virtual std::vector<std::shared_ptr<monero_tx_wallet>> sweep_dust(bool relay = false) {
      throw std::runtime_error("sweep_dust() not supported");
    }

    /**
     * Relay a transaction previously created without relaying.
     *
     * @param txMetadata is transaction metadata previously created without relaying
     * @return std::string is the hash of the relayed tx
     */
    virtual std::string relay_tx(const std::string& tx_metadata) {
      std::vector<std::string> tx_metadatas;
      tx_metadatas.push_back(tx_metadata);
      return relay_txs(tx_metadatas)[0];
    }

    /**
     * Relay a previously created transaction.
     *
     * @param tx is the transaction to relay
     * @return the hash of the relayed tx
     */
    virtual std::string relay_tx(const monero_tx_wallet& tx) {
      return relay_tx(tx.m_metadata.get());
    }

    /**
     * Relay previously created transactions.
     *
     * @param txs are the transactions to relay
     * @return the hashes of the relayed txs
     */
    virtual std::vector<std::string> relay_txs(const std::vector<std::shared_ptr<monero_tx_wallet>>& txs) {
      std::vector<std::string> tx_hexes;
      for (const std::shared_ptr<monero_tx_wallet>& tx : txs) tx_hexes.push_back(tx->m_metadata.get());
      return relay_txs(tx_hexes);
    }

    /**
     * Relay transactions previously created without relaying.
     *
     * @param tx_metadatas are transaction metadata previously created without relaying
     * @return the hashes of the relayed txs
     */
    virtual std::vector<std::string> relay_txs(const std::vector<std::string>& tx_metadatas) {
      throw std::runtime_error("relay_txs() not supported");
    }

    /**
     * Describes a tx set containing unsigned or multisig tx hex to a new tx set containing structured transactions.
     *
     * @param tx_set is a tx set containing unsigned or multisig tx hex
     * @return the tx set containing structured transactions
     */
    virtual monero_tx_set describe_tx_set(const monero_tx_set& tx_set) {
      throw std::runtime_error("describe_tx_set() not supported");
    }

    /**
     * Sign unsigned transactions from a view-only wallet.
     *
     * @param unsigned_tx_hex is unsigned transaction hex from when the transactions were created
     * @return the signed transaction hex
     */
    virtual std::string sign_txs(const std::string& unsigned_tx_hex) {
      throw std::runtime_error("sign_txs() not supported");
    }

    /**
     * Submit signed transactions from a view-only wallet.
     *
     * @param signed_tx_hex is signed transaction hex from signTxs()
     * @return the resulting transaction hashes
     */
    virtual std::vector<std::string> submit_txs(const std::string& signed_tx_hex) {
      throw std::runtime_error("submit_txs() not supported");
    }

    /**
     * Sign a message.
     *
     * @param msg - the message to sign
     * @param signature_type - sign with spend key or spend key
     * @param account_idx - the account index of the message signature (default 0)
     * @param subaddress_idx - the subaddress index of the message signature (default 0)
     * @return the message signature
     */
    virtual std::string sign_message(const std::string& msg, monero_message_signature_type signature_type, uint32_t account_idx = 0, uint32_t subaddress_idx = 0) const {
      throw std::runtime_error("sign_message() not supported");
    }

    /**
     * Verify a message signature.
     *
     * @param msg - the signed message
     * @param address - signing address
     * @param signature - signature
     * @return the message signature result
     */
    virtual monero_message_signature_result verify_message(const std::string& msg, const std::string& address, const std::string& signature) const {
      throw std::runtime_error("verify_message() not supported");
    }

    /**
     * Get a transaction's secret key from its hash.
     *
     * @param tx_hash is the transaction's hash
     * @return is the transaction's secret key
     */
    virtual std::string get_tx_key(const std::string& tx_hash) const {
      throw std::runtime_error("get_tx_key() not supported");
    }

    /**
     * Check a transaction in the blockchain with its secret key.
     *
     * @param tx_hash specifies the transaction to check
     * @param tx_key is the transaction's secret key
     * @param address is the destination public address of the transaction
     * @return the result of the check
     */
    virtual std::shared_ptr<monero_check_tx> check_tx_key(const std::string& tx_hash, const std::string& tx_key, const std::string& address) const {
      throw std::runtime_error("check_tx_key() not supported");
    }

    /**
     * Get a transaction signature to prove it.
     *
     * @param tx_hash specifies the transaction to prove
     * @param address is the destination public address of the transaction
     * @param message is a message to include with the signature to further authenticate the proof (optional)
     * @return the transaction signature
     */
    virtual std::string get_tx_proof(const std::string& tx_hash, const std::string& address, const std::string& message) const {
      throw std::runtime_error("get_tx_proof() not supported");
    }

    /**
     * Prove a transaction by checking its signature.
     *
     * @param tx_hash specifies the transaction to prove
     * @param address is the destination public address of the transaction
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @param signature is the transaction signature to confirm
     * @return the result of the check
     */
    virtual std::shared_ptr<monero_check_tx> check_tx_proof(const std::string& tx_hash, const std::string& address, const std::string& message, const std::string& signature) const {
      throw std::runtime_error("check_tx_proof() not supported");
    }

    /**
     * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
     *
     * @param tx_hash specifies the transaction to prove
     * @param message is a message to include with the signature to further authenticate the proof (optional)
     * @return the transaction signature
     */
    virtual std::string get_spend_proof(const std::string& tx_hash, const std::string& message) const {
      throw std::runtime_error("get_spend_proof() not supported");
    }

    /**
     * Prove a spend using a signature. Unlike proving a transaction, it does not require the destination public address.
     *
     * @param tx_hash specifies the transaction to prove
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @param signature is the transaction signature to confirm
     * @return true if the signature is good, false otherwise
     */
    virtual bool check_spend_proof(const std::string& tx_hash, const std::string& message, const std::string& signature) const {
      throw std::runtime_error("check_spend_proof() not supported");
    }

    /**
     * Generate a signature to prove the entire balance of the wallet.
     *
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @return the reserve proof signature
     */
    virtual std::string get_reserve_proof_wallet(const std::string& message) const {
      throw std::runtime_error("get_reserve_proof_wallet() not supported");
    }

    /**
     * Generate a signature to prove an available amount in an account.
     *
     * @param account_idx specifies the account to prove ownership of the amount
     * @param amount is the minimum amount to prove as available in the account
     * @param message is a message to include with the signature to further authenticate the proof (optional)
     * @return the reserve proof signature
     */
    virtual std::string get_reserve_proof_account(uint32_t account_idx, uint64_t amount, const std::string& message) const {
      throw std::runtime_error("get_reserve_proof_account() not supported");
    }

    /**
     * Proves a wallet has a disposable reserve using a signature.
     *
     * @param address is the public wallet address
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @param signature is the reserve proof signature to check
     * @return the result of checking the signature proof
     */
    virtual std::shared_ptr<monero_check_reserve> check_reserve_proof(const std::string& address, const std::string& message, const std::string& signature) const {
      throw std::runtime_error("check_reserve_proof() not supported");
    }

    /**
     * Get a transaction note.
     *
     * @param tx_hash specifies the transaction to get the note of
     * @return the tx note
     */
    virtual std::string get_tx_note(const std::string& tx_hash) const {
      throw std::runtime_error("get_tx_note() not supported");
    }

    /**
     * Get notes for multiple transactions.
     *
     * @param tx_hashes identify the transactions to get notes for
     * @preturns notes for the transactions
     */
    virtual std::vector<std::string> get_tx_notes(const std::vector<std::string>& tx_hashes) const {
      throw std::runtime_error("get_tx_notes() not supported");
    }

    /**
     * Set a note for a specific transaction.
     *
     * @param tx_hash specifies the transaction
     * @param note specifies the note
     */
    virtual void set_tx_note(const std::string& tx_hash, const std::string& note) {
      throw std::runtime_error("set_tx_note() not supported");
    }

    /**
     * Set notes for multiple transactions.
     *
     * @param tx_hashes specify the transactions to set notes for
     * @param notes are the notes to set for the transactions
     */
    virtual void set_tx_notes(const std::vector<std::string>& tx_hashes, const std::vector<std::string>& notes) {
      throw std::runtime_error("set_tx_notes() not supported");
    }

    /**
     * Get all address book entries.
     *
     * @param indices are indices of the entries to get
     * @return the address book entries
     */
    virtual std::vector<monero_address_book_entry> get_address_book_entries(const std::vector<uint64_t>& indices) const {
      throw std::runtime_error("get_address_book_entries() not supported");
    }

    /**
     * Add an address book entry.
     *
     * @param address is the entry address
     * @param description is the entry description (optional)
     * @return the index of the added entry
     */
    virtual uint64_t add_address_book_entry(const std::string& address, const std::string& description) {
      throw std::runtime_error("add_address_book_entry() not supported");
    }

    /**
     * Edit an address book entry.
     *
     * @param index is the index of the address book entry to edit
     * @param set_address specifies if the address should be updated
     * @param address is the updated address
     * @param set_description specifies if the description should be updated
     * @param description is the updated description
     */
    virtual void edit_address_book_entry(uint64_t index, bool set_address, const std::string& address, bool set_description, const std::string& description) {
      throw std::runtime_error("edit_address_book_entry() not supported");
    }

    /**
     * Delete an address book entry.
     *
     * @param index is the index of the entry to delete
     */
    virtual void delete_address_book_entry(uint64_t index) {
      throw std::runtime_error("delete_address_book_entry() not supported");
    }

    /**
     * Creates a payment URI from a tx configuration.
     *
     * @param config specifies configuration for a potential tx
     * @return is the payment uri
     */
    virtual std::string create_payment_uri(const monero_tx_config& config) const {
      throw std::runtime_error("create_payment_uri() not supported");
    }

    /**
     * Parses a payment URI to a tx configuration.
     *
     * @param uri is the payment uri to parse
     * @return the tx configuration parsed from the uri
     */
    virtual std::shared_ptr<monero_tx_config> parse_payment_uri(const std::string& uri) const {
      throw std::runtime_error("parse_payment_uri() not supported");
    }

    /**
     * Get an attribute.
     *
     * @param key is the attribute to get the value of
     * @param value is set to the key's value if set
     * @return true if the key's value has been set, false otherwise
     */
    virtual bool get_attribute(const std::string& key, std::string& value) const {
      throw std::runtime_error("get_attribute() not supported");
    }

    /**
     * Set an arbitrary attribute.
     *
     * @param key is the attribute key
     * @param val is the attribute value
     */
    virtual void set_attribute(const std::string& key, const std::string& val) {
      throw std::runtime_error("set_attribute() not supported");
    }

    /**
     * Start mining.
     *
     * @param num_threads is the number of threads created for mining (optional)
     * @param background_mining specifies if mining should occur in the background (optional)
     * @param ignore_battery specifies if the battery should be ignored for mining (optional)
     */
    virtual void start_mining(boost::optional<uint64_t> num_threads, boost::optional<bool> background_mining, boost::optional<bool> ignore_battery) {
      throw std::runtime_error("start_mining() not supported");
    }

    /**
     * Stop mining.
     */
    virtual void stop_mining() {
      throw std::runtime_error("stop_mining() not supported");
    }

    /**
     * Wait for the next block to be added to the chain.
     *
     * @return the height of the next block when it is added to the chain
     */
    virtual uint64_t wait_for_next_block() {
      throw std::runtime_error("wait_for_next_block() not supported");
    }

    /**
     * Indicates if importing multisig data is needed for returning a correct balance.
     *
     * @return true if importing multisig data is needed for returning a correct balance, false otherwise
     */
    virtual bool is_multisig_import_needed() const {
      throw std::runtime_error("is_multisig_import_needed() not supported");
    }

    /**
     * Indicates if this wallet is a multisig wallet.
     *
     * @return true if this is a multisig wallet, false otherwise
     */
    virtual bool is_multisig() const {
      return get_multisig_info().m_is_multisig;
    }

    /**
     * Get multisig info about this wallet.
     *
     * @return multisig info about this wallet
     */
    virtual monero_multisig_info get_multisig_info() const {
      throw std::runtime_error("get_multisig_info() not supported");
    }

    /**
     * Get multisig info as hex to share with participants to begin creating a
     * multisig wallet.
     *
     * @return this wallet's multisig hex to share with participants
     */
    virtual std::string prepare_multisig() {
      throw std::runtime_error("prepare_multisig() not supported");
    }

    /**
     * Make this wallet multisig by importing multisig hex from participants.
     *
     * @param multisig_hexes are multisig hex from each participant
     * @param threshold is the number of signatures needed to sign transfers
     * @password is the wallet password
     * @return the result which has the multisig's address xor this wallet's multisig hex to share with participants iff not N/N
     */
    virtual monero_multisig_init_result make_multisig(const std::vector<std::string>& multisig_hexes, int threshold, const std::string& password) {
      throw std::runtime_error("make_multisig() not supported");
    }

    /**
     * Exchange multisig hex with participants in a M/N multisig wallet.
     *
     * This process must be repeated with participants exactly N-M times.
     *
     * @param multisig_hexes are multisig hex from each participant
     * @param password is the wallet's password // TODO monero-project: redundant? wallet is created with password
     * @return the result which has the multisig's address xor this wallet's multisig hex to share with participants iff not done
     */
    virtual  monero_multisig_init_result exchange_multisig_keys(const std::vector<std::string>& mutisig_hexes, const std::string& password) {
      throw std::runtime_error("exchange_multisig_keys() not supported");
    }

    /**
     * Export this wallet's multisig info as hex for other participants.
     *
     * @return this wallet's multisig info as hex for other participants
     */
    virtual std::string get_multisig_hex() {
      throw std::runtime_error("get_multisig_hex() not supported");
    }

    /**
     * Import multisig info as hex from other participants.
     *
     * Note: If the daemon is not trusted, this method will not automatically
     * update the spent status after importing peer multisig hex.  In that case,
     * the
     *
     * @param multisig_hexes are multisig hex from each participant
     * @return the number of outputs signed with the given multisig hex
     */
    virtual int import_multisig_hex(const std::vector<std::string>& multisig_hexes) {
      throw std::runtime_error("import_multisig_hex() not supported");
    }

    /**
     * Sign previously created multisig transactions as represented by hex.
     *
     * @param multisig_tx_hex is the hex shared among the multisig transactions when they were created
     * @return the result of signing the multisig transactions
     */
    virtual monero_multisig_sign_result sign_multisig_tx_hex(const std::string& multisig_tx_hex) {
      throw std::runtime_error("monero_multisig_sign_result() not supported");
    }

    /**
     * Submit signed multisig transactions as represented by a hex std::string.
     *
     * @param signed_multisig_tx_hex is the signed multisig hex returned from signMultisigTxs()
     * @return the resulting transaction hashes
     */
    virtual std::vector<std::string> submit_multisig_tx_hex(const std::string& signed_multisig_tx_hex) {
      throw std::runtime_error("submit_multisig_tx_hex() not supported");
    }

    /**
     * Save the wallet at its current path.
     */
    virtual void save() {
      throw std::runtime_error("save() not supported");
    }

    /**
     * Move the wallet from its current path to the given path.
     *
     * @param path is the new wallet's path
     * @param password is the new wallet's password
     */
    virtual void move_to(std::string path, std::string password) {
      throw std::runtime_error("move_to() not supported");
    }

    /**
     * Optionally save then close the wallet.
     *
     * @param save specifies if the wallet should be saved before being closed (default false)
     */
    virtual void close(bool save = false) {
      throw std::runtime_error("close() not supported");
    }
  };
}
