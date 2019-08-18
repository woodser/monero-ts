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

#include "monero_wallet_model.h"
#include "wallet/wallet2.h"

#include <boost/thread/mutex.hpp>
#include <boost/thread/thread.hpp>
#include <boost/thread/condition_variable.hpp>

using namespace std;
using namespace crypto;
using namespace monero;

/**
 * Public library interface.
 */
namespace monero {

  // --------------------------------- LISTENERS ------------------------------

  /**
   * Receives progress notifications as a wallet is synchronized.
   *
   * TODO: make these interfaces and provide default implementation
   */
  class monero_sync_listener {
  public:

    /**
     * Invoked when sync progress is made.
     *
     * @param height is the height of the synced block
     * @param start_height is the starting height of the sync request
     * @param end_height is the ending height of the sync request
     * @param percent_done is the sync progress as a percentage
     * @param message is a human-readable description of the current progress
     */
    virtual void on_sync_progress(uint64_t height, uint64_t start_height, uint64_t end_height, double percent_done, const string& message) {}
  };

  /**
   * Receives notifications as a wallet is updated.
   */
  class monero_wallet_listener : public monero_sync_listener {
  public:

    /**
     * Invoked when a new block is processed.
     *
     * @param block is the newly processed block
     */
    virtual void on_new_block(uint64_t height) {};

    /**
     * Invoked when the wallet receives an output.
     *
     * @param output is the incoming output to the wallet
     */
    virtual void on_output_received(const monero_output_wallet& output) {};

    /**
     * Invoked when the wallet spends an output.
     *
     * @param output the outgoing transfer from the wallet
     */
    virtual void on_output_spent(const monero_output_wallet& output) {};
  };

  // forward declaration of internal wallet2 listener
  struct wallet2_listener;

  // ---------------------------- WALLET INTERFACE ----------------------------

  /**
   * Monero wallet interface.
   */
  class monero_wallet {

  public:

    /**
     * Indicates if a wallet exists at the given path.
     *
     * @param path is the path to check for a wallet
     * @return true if a wallet exists at the given path, false otherwise
     */
    static bool wallet_exists(const string& path);

    /**
     * Open an existing wallet.
     *
     * @param path is the path to the wallet file to open
     * @param password is the password of the wallet file to open
     * @param network_type is the wallet's network type
     */
    static monero_wallet* open_wallet(const string& path, const string& password, const monero_network_type network_type);

    /**
     * Create a new wallet with a randomly generated seed.
     *
     * @param path is the path to create the wallet
     * @param password is the password encrypt the wallet
     * @param network_type is the wallet's network type (default = monero_network_type.MAINNET)
     * @param daemon_connection is connection information to a daemon (default = an unconnected wallet)
     * @param language is the wallet and mnemonic's language (default = "English")
     */
    static monero_wallet* create_wallet_random(const string& path, const string& password);
    static monero_wallet* create_wallet_random(const string& path, const string& password, const monero_network_type network_type, const monero_rpc_connection& daemon_connection, const string& language);

    /**
     * Create a wallet from an existing mnemonic phrase.
     *
     * @param path is the path to create the wallet
     * @param password is the password encrypt the wallet
     * @param network_type is the wallet's network type
     * @param mnemonic is the mnemonic of the wallet to construct
     * @param daemon_connection is connection information to a daemon (default = an unconnected wallet)
     * @param restore_height is the block height to restore (i.e. scan the chain) from (default = 0)
     */
    static monero_wallet* create_wallet_from_mnemonic(const string& path, const string& password, const monero_network_type network_type, const string& mnemonic);
    static monero_wallet* create_wallet_from_mnemonic(const string& path, const string& password, const monero_network_type network_type, const string& mnemonic, const monero_rpc_connection& daemon_connection, uint64_t restore_height);

    /**
     * Create a wallet from an address, view key, and spend key.
     *
     * @param path is the path to create the wallet
     * @param password is the password encrypt the wallet
     * @param network_type is the wallet's network type
     * @param address is the address of the wallet to construct
     * @param view_key is the view key of the wallet to construct
     * @param spend_key is the spend key of the wallet to construct
     * @param daemon_connection is connection information to a daemon (default = an unconnected wallet)
     * @param restore_height is the block height to restore (i.e. scan the chain) from (default = 0)
     * @param language is the wallet and mnemonic's language (default = "English")
     */
    static monero_wallet* create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key);
    static monero_wallet* create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key, const monero_rpc_connection& daemon_connection, uint64_t restore_height);
    static monero_wallet* create_wallet_from_keys(const string& path, const string& password, const monero_network_type network_type, const string& address, const string& view_key, const string& spend_key, const monero_rpc_connection& daemon_connection, uint64_t restore_height, const string& language);

    /**
     * Deconstruct the wallet.
     */
    ~monero_wallet();

    /**
     * Get the height of the last block processed by the wallet (its index + 1).
     *
     * @return the height of the last block processed by the wallet
     */
    uint64_t get_height() const;

    /**
     * Get the height of the first block that the wallet scans.
     *
     * @return the height of the first block that the wallet scans
     */
    uint64_t get_restore_height() const;

    /**
     * Set the height of the first block that the wallet scans.
     *
     * @param restore_height is the height of the first block that the wallet scans
     */
    void set_restore_height(uint64_t restore_height);

    /**
     * Get the height that the wallet's daemon is synced to.
     *
     * @return the height that the wallet's daemon is synced to
     */
    uint64_t get_daemon_height() const;

    /**
     * Get the maximum height of the peers the wallet's daemon is connected to.
     *
     * @return the maximum height of the peers the wallet's daemon is connected to
     */
    uint64_t get_daemon_max_peer_height() const;

    /**
     * Set the wallet's daemon connection.
     *
     * @param uri is the daemon's URI
     * @param username is the username to authenticate with the daemon (optional)
     * @param password is the password to authenticate with the daemon (optional)
     */
    void set_daemon_connection(const string& uri, const string& username = "", const string& password = "");

    /**
     * Set the wallet's daemon connection.
     *
     * @param connection is the connection to set
     */
    void set_daemon_connection(const monero_rpc_connection& connection);

    /**
     * Get the wallet's daemon connection.
     *
     * @return the wallet's daemon connection
     */
    shared_ptr<monero_rpc_connection> get_daemon_connection() const;

    /**
     * Indicates if the wallet is connected a daemon.
     *
     * @return true if the wallet is connected to a daemon, false otherwise
     */
    bool is_connected() const;

    /**
     * Indicates if the wallet's daemon is synced with the network.
     *
     * @return true if the daemon is synced with the network, false otherwise
     */
    bool is_daemon_synced() const;

    /**
     * Indicates if the daemon is trusted or untrusted.
     *
     * @return true if the daemon is trusted, false otherwise
     */
    bool is_daemon_trusted() const;

    /**
     * Indicates if the wallet is synced with the daemon.
     *
     * @return true if the wallet is synced with the daemon, false otherwise
     */
    bool is_synced() const;

    /**
     * Get the path of this wallet's file on disk.
     *
     * @return the path of this wallet's file on disk
     */
    string get_path() const;

    /**
     * Get the wallet's network type (mainnet, testnet, or stagenet).
     *
     * @return the wallet's network type
     */
    monero_network_type get_network_type() const;

    /**
     * Get the wallet's seed.
     *
     * @return the wallet's seed
     */
    string get_seed() const;

    /**
     * Get the wallet's mnemonic phrase derived from the seed.
     *
     * @param mnemonic is assigned the wallet's mnemonic phrase
     */
    string get_mnemonic() const;

    /**
     * Get the language of the wallet's mnemonic phrase.
     *
     * @return the language of the wallet's mnemonic phrase
     */
    string get_language() const;

    /**
     * Get a list of available languages for the wallet's mnemonic phrase.
     *
     * @return the available languages for the wallet's mnemonic phrase
     */
    vector<string> get_languages() const;

    /**
     * Get the wallet's public view key.
     *
     * @return the wallet's public view key
     */
    string get_public_view_key() const;

    /**
     * Get the wallet's private view key.
     *
     * @return the wallet's private view key
     */
    string get_private_view_key() const;

    /**
     * Get the wallet's public spend key.
     *
     * @return the wallet's public spend key
     */
    string get_public_spend_key() const;

    /**
     * Get the wallet's private spend key.
     *
     * @return the wallet's private spend key
     */
    string get_private_spend_key() const;

    /**
     * Get the wallet's primary address.
     *
     * @return the wallet's primary address
     */
    string get_primary_address() const;

    /**
     * Get the address of a specific subaddress.
     *
     * @param account_idx specifies the account index of the address's subaddress
     * @param subaddress_idx specifies the subaddress index within the account
     * @return the receive address of the specified subaddress
     */
    string get_address(const uint32_t account_idx, const uint32_t subaddress_idx) const;

    /**
     * Get the account and subaddress index of the given address.
     *
     * @param address is the address to get the account and subaddress index from
     * @return the account and subaddress indices
     * @throws exception if address is not a wallet address
     */
    monero_subaddress get_address_index(const string& address) const;

    /**
     * Get an integrated address from a standard address and a payment id.
     *
     * @param standard_address is the integrated addresse's standard address (defaults to wallet's primary address)
     * @param payment_id is the integrated addresse's payment id (defaults to randomly generating new payment id)
     * @return the integrated address
     */
    monero_integrated_address get_integrated_address(const string& standard_address = "", const string& payment_id = "") const;

    /**
     * Decode an integrated address to get its standard address and payment id.
     *
     * @param integrated_address is an integrated address to decode
     * @return the decoded integrated address including standard address and payment id
     */
    monero_integrated_address decode_integrated_address(const string& integrated_address) const;

    /**
     * Register a listener receive wallet notifications.
     *
     * @param listener is the listener to receive wallet notifications
     */
    void add_listener(monero_wallet_listener& listener);

    /**
     * Unregister a listener to receive wallet notifications.
     *
     * @param listener is the listener to unregister
     */
    void remove_listener(monero_wallet_listener& listener);

    /**
     * Get the listeners registered with the wallet.
     */
    set<monero_wallet_listener*> get_listeners();

    /**
     * Synchronize the wallet with the daemon as a one-time synchronous process.
     *
     * @return the sync result
     */
    monero_sync_result sync();

    /**
     * Synchronize the wallet with the daemon as a one-time synchronous process.
     *
     * @param listener is invoked as sync progress is made
     * @return the sync result
     */
    monero_sync_result sync(monero_sync_listener& listener);

    /**
     * Synchronize the wallet with the daemon as a one-time synchronous process.
     *
     * @param start_height is the start height to sync from (ignored if less than last processed block)
     * @return the sync result
     */
    monero_sync_result sync(uint64_t start_height);

    /**
     * Synchronizes the wallet with the blockchain.
     *
     * @param start_height is the start height to sync from (ignored if less than last processed block)
     * @param listener is invoked as sync progress is made
     * @return the sync result
     */
    monero_sync_result sync(uint64_t start_height, monero_sync_listener& listener);

    /**
     * Start an asynchronous thread to continuously synchronize the wallet with the daemon.
     */
    void start_syncing();

    /**
     * Stop the asynchronous thread to continuously synchronize the wallet with the daemon.
     */
    void stop_syncing();

    /**
     * Rescan the blockchain for spent outputs.
     *
     * Note: this can only be called with a trusted daemon.
     *
     * Example use case: peer multisig hex is import when connected to an untrusted daemon,
     * so the wallet will not rescan spent outputs.  Then the wallet connects to a trusted
     * daemon.  This method should be manually invoked to rescan outputs.
     */
    void rescan_spent();

    /**
     * Rescan the blockchain from scratch, losing any information which cannot be recovered from
     * the blockchain itself.
     *
     * WARNING: This method discards local wallet data like destination addresses, tx secret keys,
     * tx notes, etc.
     */
    void rescan_blockchain();

//    /**
//     * Indicates if importing multisig data is needed for returning a correct balance.
//     *
//     * @return true if importing multisig data is needed for returning a correct balance, false otherwise
//     */
//    public boolean isMultisigImportNeeded();

    /**
     * Get the wallet's balance.
     *
     * @return the wallet's balance
     */
    uint64_t get_balance() const;

    /**
     * Get an account's balance.
     *
     * @param account_idx is the index of the account to get the balance of
     * @return the account's balance
     */
    uint64_t get_balance(uint32_t account_idx) const;

    /**
     * Get a subaddress's balance.
     *
     * @param account_idx is the index of the subaddress's account to get the balance of
     * @param subaddress_idx is the index of the subaddress to get the balance of
     * @return the subaddress's balance
     */
    uint64_t get_balance(uint32_t account_idx, uint32_t subaddress_idx) const;

    /**
     * Get the wallet's unlocked balance.
     *
     * @return the wallet's unlocked balance
     */
    uint64_t get_unlocked_balance() const;

    /**
     * Get an account's unlocked balance.
     *
     * @param account_idx is the index of the account to get the unlocked balance of
     * @return the account's unlocked balance
     */
    uint64_t get_unlocked_balance(uint32_t account_idx) const;

    /**
     * Get a subaddress's unlocked balance.
     *
     * @param account_idx is the index of the subaddress's account to get the unlocked balance of
     * @param subaddress_idx is the index of the subaddress to get the unlocked balance of
     * @return the subaddress's balance
     */
    uint64_t get_unlocked_balance(uint32_t account_idx, uint32_t subaddress_idx) const;

    /**
     * Get all accounts.
     *
     * @return List<monero_account> are all accounts within the wallet
     */
    vector<monero_account> get_accounts() const;

    /**
     * Get all accounts.
     *
     * @param include_subaddresses specifies if subaddresses should be included
     * @return List<monero_account> are all accounts
     */
    vector<monero_account> get_accounts(bool include_subaddresses) const;

    /**
     * Get accounts with a given tag.
     *
     * @param tag is the tag for filtering accounts, all accounts if null
     * @return List<monero_account> are all accounts for the wallet with the given tag
     */
    vector<monero_account> get_accounts(const string& tag) const;

    /**
     * Get accounts with a given tag.
     *
     * @param include_subaddresses specifies if subaddresses should be included
     * @param tag is the tag for filtering accounts, all accounts if null
     * @return List<monero_account> are all accounts for the wallet with the given tag
     */
    vector<monero_account> get_accounts(bool include_subaddresses, const string& tag) const;

    /**
     * Get an account without subaddress information.
     *
     * @param account_idx specifies the account to get
     * @return the retrieved account
     */
    monero_account get_account(uint32_t account_idx) const;

    /**
     * Get an account.
     *
     * @param account_idx specifies the account to get
     * @param include_subaddresses specifies if subaddresses should be included
     * @return the retrieved account
     */
    monero_account get_account(const uint32_t account_idx, bool include_subaddresses) const;

    /**
     * Create a new account with a label for the first subaddress.
     *
     * @param label specifies the label for the account's first subaddress (optional)
     * @return the created account
     */
    monero_account create_account(const string& label = "");

    /**
     * Get all subaddresses in an account.
     *
     * @param account_idx specifies the account to get subaddresses within
     * @return List<monero_subaddress> are the retrieved subaddresses
     */
    vector<monero_subaddress> get_subaddresses(const uint32_t account_idx) const;

    /**
     * Get subaddresses in an account.
     *
     * @param account_idx specifies the account to get subaddresses within
     * @param subaddress_indices are specific subaddresses to get (optional)
     * @return the retrieved subaddresses
     */
    vector<monero_subaddress> get_subaddresses(const uint32_t account_idx, const vector<uint32_t>& subaddress_indices) const;

    /**
     * Get a subaddress.
     *
     * @param account_idx specifies the index of the subaddress's account
     * @param subaddress_idx specifies index of the subaddress within the account
     * @return the retrieved subaddress
     */
    monero_subaddress getSubaddress(const uint32_t account_idx, const uint32_t subaddress_idx) const;

    /**
     * Create a subaddress within an account.
     *
     * @param account_idx specifies the index of the account to create the subaddress within
     * @param label specifies the the label for the subaddress (defaults to empty string)
     * @return the created subaddress
     */
    monero_subaddress create_subaddress(uint32_t account_idx, const string& label = "");

//    /**
//     * Get a wallet transaction by id.
//     *
//     * @param tx_id is an id of a transaction to get
//     * @return monero_tx_wallet is the identified transactions
//     */
//    public monero_tx_wallet getTx(string tx_id);

    /**
     * Get all wallet transactions.  Wallet transactions contain one or more
     * transfers that are either incoming or outgoing to the wallet.
     *
     * @return all wallet transactions
     */
    vector<shared_ptr<monero_tx_wallet>> get_txs() const;

//    /**
//     * Get wallet transactions by id.
//     *
//     * @param tx_ids are ids of transactions to get
//     * @return the identified transactions
//     */
//    public List<monero_tx_wallet> get_txs(Collection<string> tx_ids);

    /**
     * Get wallet transactions.  Wallet transactions contain one or more
     * transfers that are either incoming or outgoing to the wallet.
     *
     * Query results can be filtered by passing in a transaction request.
     * Transactions must meet every criteria defined in the request in order to
     * be returned.  All filtering is optional and no filtering is applied when
     * not defined.
     *
     * @param request filters query results (optional)
     * @return wallet transactions per the request
     */
    vector<shared_ptr<monero_tx_wallet>> get_txs(const monero_tx_query& request) const;

//    /**
//     * Get all incoming and outgoing transfers to and from this wallet.  An
//     * outgoing transfer represents a total amount sent from one or more
//     * subaddresses within an account to individual destination addresses, each
//     * with their own amount.  An incoming transfer represents a total amount
//     * received into a subaddress within an account.  Transfers belong to
//     * transactions which are stored on the blockchain.
//     *
//     * @return all wallet transfers
//     */
//    public List<monero_transfer> get_transfers();
//
//    /**
//     * Get incoming and outgoing transfers to and from an account.  An outgoing
//     * transfer represents a total amount sent from one or more subaddresses
//     * within an account to individual destination addresses, each with their
//     * own amount.  An incoming transfer represents a total amount received into
//     * a subaddress within an account.  Transfers belong to transactions which
//     * are stored on the blockchain.
//     *
//     * @param account_idx is the index of the account to get transfers from
//     * @return transfers to/from the account
//     */
//    public List<monero_transfer> get_transfers(int account_idx);
//
//    /**
//     * Get incoming and outgoing transfers to and from a subaddress.  An outgoing
//     * transfer represents a total amount sent from one or more subaddresses
//     * within an account to individual destination addresses, each with their
//     * own amount.  An incoming transfer represents a total amount received into
//     * a subaddress within an account.  Transfers belong to transactions which
//     * are stored on the blockchain.
//     *
//     * @param account_idx is the index of the account to get transfers from
//     * @param subaddress_idx is the index of the subaddress to get transfers from
//     * @return transfers to/from the subaddress
//     */
//    public List<monero_transfer> get_transfers(int account_idx, int subaddress_idx);

    /**
     * Get incoming and outgoing transfers to and from this wallet.  An outgoing
     * transfer represents a total amount sent from one or more subaddresses
     * within an account to individual destination addresses, each with their
     * own amount.  An incoming transfer represents a total amount received into
     * a subaddress within an account.  Transfers belong to transactions which
     * are stored on the blockchain.
     *
     * Query results can be filtered by passing in a monero_transfer_query.
     * Transfers must meet every criteria defined in the request in order to be
     * returned.  All filtering is optional and no filtering is applied when not
     * defined.
     *
     * @param request filters query results (optional)
     * @return wallet transfers per the request
     */
    vector<shared_ptr<monero_transfer>> get_transfers(const monero_transfer_query& request) const;

//    /**
//     * Get outputs created from previous transactions that belong to the wallet
//     * (i.e. that the wallet can spend one time).  Outputs are part of
//     * transactions which are stored in blocks on the blockchain.
//     *
//     * @return List<monero_output_wallet> are all wallet outputs
//     */
//    public List<monero_output_wallet> get_outputs();

    /**
     * Get outputs created from previous transactions that belong to the wallet
     * (i.e. that the wallet can spend one time).  Outputs are part of
     * transactions which are stored in blocks on the blockchain.
     *
     * Results can be configured by passing a monero_output_query.  Outputs must
     * meet every criteria defined in the request in order to be returned.  All
     * filtering is optional and no filtering is applied when not defined.
     *
     * @param request specifies request options (optional)
     * @return List<monero_output_wallet> are wallet outputs per the request
     */
    vector<shared_ptr<monero_output_wallet>> get_outputs(const monero_output_query& request) const;

    /**
     * Export all outputs in hex format.
     *
     * @return all outputs in hex format, empty string if no outputs
     */
    string get_outputs_hex() const;

    /**
     * Import outputs in hex format.
     *
     * @param outputs_hex are outputs in hex format
     * @return the number of outputs imported
     */
    int import_outputs_hex(const string& outputs_hex);

    /**
     * Get all signed key images.
     *
     * @return the wallet's signed key images
     */
    vector<shared_ptr<monero_key_image>> get_key_images() const;

    /**
     * Import signed key images and verify their spent status.
     *
     * @param key_images are key images to import and verify (requires hex and signature)
     * @return results of the import
     */
    shared_ptr<monero_key_image_import_result> import_key_images(const vector<shared_ptr<monero_key_image>>& key_images);

//    /**
//     * Get new key images from the last imported outputs.
//     *
//     * @return the key images from the last imported outputs
//     */
//    public List<monero_key_image> getNewKeyImagesFromLastImport();

    /**
     * Create a transaction to transfer funds from this wallet according to the
     * given request.  The transaction may be relayed later.
     *
     * @param request configures the transaction to create
     * @return the created transaction
     */
    shared_ptr<monero_tx_wallet> create_tx(monero_send_request& request);

    /**
     * Create a transaction to transfers funds from this wallet to a destination address.
     * The transaction may be relayed later.
     *
     * @param accountIndex is the index of the account to withdraw funds from
     * @param address is the destination address to send funds to
     * @param amount is the amount being sent
     * @return the resulting transaction
     */
    shared_ptr<monero_tx_wallet> create_tx(uint32_t account_index, string address, uint64_t amount);

    /**
     * Create a transaction to transfers funds from this wallet to a destination address.
     * The transaction may be relayed later.
     *
     * @param accountIndex is the index of the account to withdraw funds from
     * @param address is the destination address to send funds to
     * @param amount is the amount being sent
     * @param priority is the send priority (default normal)
     * @return the resulting transaction
     */
    shared_ptr<monero_tx_wallet> create_tx(int account_index, string address, uint64_t amount, monero_send_priority priority);

    /**
     * Create one or more transactions to transfer funds from this wallet
     * according to the given request.  The transactions may later be relayed.
     *
     * @param request configures the transactions to create
     * @return the created transactions
     */
    vector<shared_ptr<monero_tx_wallet>> create_txs(monero_send_request& request);

    /**
     * Relay a transaction previously created without relaying.
     *
     * @param txMetadata is transaction metadata previously created without relaying
     * @return string is the id of the relayed tx
     */
    string relay_tx(const string& tx_metadata);

    /**
     * Relay a previously created transaction.
     *
     * @param tx is the transaction to relay
     * @return the id of the relayed tx
     */
    string relay_tx(const monero_tx_wallet& tx);

    /**
     * Relay transactions previously created without relaying.
     *
     * @param tx_metadatas are transaction metadata previously created without relaying
     * @return the ids of the relayed txs
     */
    vector<string> relay_txs(const vector<string>& tx_metadatas);

    /**
     * Relay previously created transactions.
     *
     * @param txs are the transactions to relay
     * @return the ids of the relayed txs
     */
    vector<string> relay_txs(const vector<shared_ptr<monero_tx_wallet>>& txs);

    /**
     * Create and relay a transaction to transfer funds from this wallet
     * according to the given request.
     *
     * @param request configures the transaction
     * @return the resulting transaction
     */
    shared_ptr<monero_tx_wallet> send(monero_send_request& request);

    /**
     * Create and relay a transaction to transfers funds from this wallet to
     * a destination address.
     *
     * @param account_index is the index of the account to withdraw funds from
     * @param address is the destination address to send funds to
     * @param amount is the amount being sent
     * @return the resulting transaction
     */
    shared_ptr<monero_tx_wallet> send(uint32_t account_index, string address, uint64_t amount);

    /**
     * Create and relay a transaction to transfers funds from this wallet to
     * a destination address.
     *
     * @param account_index is the index of the account to withdraw funds from
     * @param address is the destination address to send funds to
     * @param amount is the amount being sent
     * @param priority is the send priority (default normal)
     * @return the resulting transaction
     */
    shared_ptr<monero_tx_wallet> send(uint32_t account_index, string address, uint64_t amount, monero_send_priority priority);

    /**
     * Create one or more transactions which transfer funds from this wallet to
     * one or more destinations depending on the given configuration.
     *
     * @param request configures the transaction
     * @return the resulting transaction
     */
    vector<shared_ptr<monero_tx_wallet>> send_split(const monero_send_request& request);

//
//    /**
//     * Create and relay a transaction which transfers funds from this wallet to
//     * a destination address.
//     *
//     * @param account_index is the index of the account to draw funds from
//     * @param address is the destination address to send funds to
//     * @param sendAmount is the amount being sent
//     * @return the resulting transaction
//     */
//    public monero_tx_wallet send(int account_index, string address, BigInteger sendAmount);
//
//    /**
//     * Create and relay a transaction which transfers funds from this wallet to
//     * a destination address.
//     *
//     * @param account_index is the index of the account to draw funds from
//     * @param address is the destination address to send funds to
//     * @param sendAmount is the amount being sent
//     * @param priority is the send priority (default normal)
//     * @return the resulting transaction
//     */
//    public monero_tx_wallet send(int account_index, string address, BigInteger sendAmount, monero_send_priority priority);
//
//    /**
//     * Create and relay (depending on configuration) one or more transactions
//     * which transfer funds from this wallet to one or more destination.
//     *
//     * @param request configures the transactions
//     * @return the resulting transactions
//     */
//    public List<monero_tx_wallet> send_split(monero_send_request request);
//
//    /**
//     * Create and relay one or more transactions which transfer funds from this
//     * wallet to one or more destination.
//     *
//     * @param account_index is the index of the account to draw funds from
//     * @param address is the destination address to send funds to
//     * @param sendAmount is the amount being sent
//     * @return the resulting transactions
//     */
//    public List<monero_tx_wallet> send_split(int account_index, string address, BigInteger sendAmount);
//
//    /**
//     * Create and relay one or more transactions which transfer funds from this
//     * wallet to one or more destination.
//     *
//     * @param account_index is the index of the account to draw funds from
//     * @param address is the destination address to send funds to
//     * @param sendAmount is the amount being sent
//     * @param priority is the send priority (default normal)
//     * @return the resulting transactions
//     */
//    public List<monero_tx_wallet> send_split(int account_index, string address, BigInteger sendAmount, monero_send_priority priority);

    /**
     * Sweep an output with a given key image.
     *
     * @param request configures the sweep transaction
     * @return the resulting transaction from sweeping an output
     */
    shared_ptr<monero_tx_wallet> sweep_output(const monero_send_request& request) const;

//    /**
//     * Sweep an output with a given key image.
//     *
//     * @param address is the destination address to send to
//     * @param key_image is the key image hex of the output to sweep
//     * @return the resulting transaction from sweeping an output
//     */
//    public monero_tx_wallet sweep_output(string address, string key_image);
//
//    /**
//     * Sweep an output with a given key image.
//     *
//     * @param address is the destination address to send to
//     * @param key_image is the key image hex of the output to sweep
//     * @param priority is the transaction priority (optional)
//     * @return the resulting transaction from sweeping an output
//     */
//    public monero_tx_wallet sweep_output(string address, string key_image, monero_send_priority priority);
//
//    /**
//     * Sweep a subaddress's unlocked funds to an address.
//     *
//     * @param account_idx is the index of the account
//     * @param subaddress_idx is the index of the subaddress
//     * @param address is the address to sweep the subaddress's funds to
//     * @return the resulting transactions
//     */
//    public List<monero_tx_wallet> sweepSubaddress(int account_idx, int subaddress_idx, string address);
//
//    /**
//     * Sweep an acount's unlocked funds to an address.
//     *
//     * @param account_idx is the index of the account
//     * @param address is the address to sweep the account's funds to
//     * @return the resulting transactions
//     */
//    public List<monero_tx_wallet> sweepAccount(int account_idx, string address);
//
//    /**
//     * Sweep the wallet's unlocked funds to an address.
//     *
//     * @param address is the address to sweep the wallet's funds to
//     * @return the resulting transactions
//     */
//    public List<monero_tx_wallet> sweepWallet(string address);
//
//    /**
//     * Sweep all unlocked funds according to the given request.
//     *
//     * @param request is the sweep configuration
//     * @return the resulting transactions
//     */
//    public List<monero_tx_wallet> sweepAllUnlocked(monero_send_request request);
//
//    /**
//     * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
//     *
//     * NOTE: Dust only exists pre RCT, so this method will return "no dust to sweep" on new wallets.
//     *
//     * @return the resulting transactions from sweeping dust
//     */
//    public List<monero_tx_wallet> sweep_dust();

    /**
     * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
     *
     * @param do_not_relay specifies if the resulting transaction should not be relayed (defaults to false i.e. relayed)
     * @return the resulting transactions from sweeping dust
     */
    vector<shared_ptr<monero_tx_wallet>> sweep_dust(bool do_not_relay = false);

    /**
     * Get a transaction note.
     *
     * @param tx_id specifies the transaction to get the note of
     * @return the tx note
     */
    string get_tx_note(const string& tx_id) const;

    /**
     * Get notes for multiple transactions.
     *
     * @param tx_ids identify the transactions to get notes for
     * @preturns notes for the transactions
     */
    vector<string> get_tx_notes(const vector<string>& tx_ids) const;

    /**
     * Set a note for a specific transaction.
     *
     * @param tx_id specifies the transaction
     * @param note specifies the note
     */
    void set_tx_note(const string& tx_id, const string& note);

    /**
     * Set notes for multiple transactions.
     *
     * @param tx_ids specify the transactions to set notes for
     * @param notes are the notes to set for the transactions
     */
    void set_tx_notes(const vector<string>& tx_ids, const vector<string>& notes);

    /**
     * Sign a message.
     *
     * @param msg is the message to sign
     * @return the signature
     */
    string sign(const string& msg) const;

    /**
     * Verify a signature on a message.
     *
     * @param msg is the signed message
     * @param address is the signing address
     * @param signature is the signature
     * @return true if the signature is good, false otherwise
     */
    bool verify(const string& msg, const string& address, const string& signature) const;

    /**
     * Get a transaction's secret key from its id.
     *
     * @param tx_id is the transaction's id
     * @return is the transaction's secret key
     */
    string get_tx_key(const string& tx_id) const;

    /**
     * Check a transaction in the blockchain with its secret key.
     *
     * @param tx_id specifies the transaction to check
     * @param txKey is the transaction's secret key
     * @param address is the destination public address of the transaction
     * @return the result of the check
     */
    shared_ptr<monero_check_tx> check_tx_key(const string& tx_id, const string& txKey, const string& address) const;

//    /**
//     * Get a transaction signature to prove it.
//     *
//     * @param tx_id specifies the transaction to prove
//     * @param address is the destination public address of the transaction
//     * @return the transaction signature
//     */
//    string get_tx_proof(const string& tx_id, const string& address) const;

    /**
     * Get a transaction signature to prove it.
     *
     * @param tx_id specifies the transaction to prove
     * @param address is the destination public address of the transaction
     * @param message is a message to include with the signature to further authenticate the proof (optional)
     * @return the transaction signature
     */
    string get_tx_proof(const string& tx_id, const string& address, const string& message) const;

    /**
     * Prove a transaction by checking its signature.
     *
     * @param tx_id specifies the transaction to prove
     * @param address is the destination public address of the transaction
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @param signature is the transaction signature to confirm
     * @return the result of the check
     */
    shared_ptr<monero_check_tx> check_tx_proof(const string& tx_id, const string& address, const string& message, const string& signature) const;

//    /**
//     * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
//     *
//     * @param tx_id specifies the transaction to prove
//     * @return the transaction signature
//     */
//    string get_spend_proof(const string& tx_id) const;

    /**
     * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
     *
     * @param tx_id specifies the transaction to prove
     * @param message is a message to include with the signature to further authenticate the proof (optional)
     * @return the transaction signature
     */
    string get_spend_proof(const string& tx_id, const string& message) const;

    /**
     * Prove a spend using a signature. Unlike proving a transaction, it does not require the destination public address.
     *
     * @param tx_id specifies the transaction to prove
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @param signature is the transaction signature to confirm
     * @return true if the signature is good, false otherwise
     */
    bool check_spend_proof(const string& tx_id, const string& message, const string& signature) const;

    /**
     * Generate a signature to prove the entire balance of the wallet.
     *
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @return the reserve proof signature
     */
    string get_reserve_proof_wallet(const string& message) const;

    /**
     * Generate a signature to prove an available amount in an account.
     *
     * @param account_idx specifies the account to prove ownership of the amount
     * @param amount is the minimum amount to prove as available in the account
     * @param message is a message to include with the signature to further authenticate the proof (optional)
     * @return the reserve proof signature
     */
    string get_reserve_proof_account(uint32_t account_idx, uint64_t amount, const string& message) const;

    /**
     * Proves a wallet has a disposable reserve using a signature.
     *
     * @param address is the public wallet address
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @param signature is the reserve proof signature to check
     * @return the result of checking the signature proof
     */
    shared_ptr<monero_check_reserve> check_reserve_proof(const string& address, const string& message, const string& signature) const;

//    /**
//     * Get all address book entries.
//     *
//     * @return the address book entries
//     */
//    public List<MoneroAddressBookEntry> getAddressBookEntries();
//
//    /**
//     * Get address book entries.
//     *
//     * @param entryIndices are indices of the entries to get
//     * @return the address book entries
//     */
//    public List<MoneroAddressBookEntry> getAddressBookEntries(Collection<Integer> entryIndices);
//
//    /**
//     * Add an address book entry.
//     *
//     * @param address is the entry address
//     * @param description is the entry description (optional)
//     * @return the index of the added entry
//     */
//    public int addAddressBookEntry(string address, string description);
//
//    /**
//     * Add an address book entry.
//     *
//     * @param address is the entry address
//     * @param description is the entry description (optional)
//     * @param payment_id is the entry paymet id (optional)
//     * @return the index of the added entry
//     */
//    public int addAddressBookEntry(string address, string description, string payment_id);
//
//    /**
//     * Delete an address book entry.
//     *
//     * @param entryIdx is the index of the entry to delete
//     */
//    public void deleteAddressBookEntry(int entryIdx);
//
//    /**
//     * Tag accounts.
//     *
//     * @param tag is the tag to apply to the specified accounts
//     * @param accountIndices are the indices of the accounts to tag
//     */
//    public void tagAccounts(string tag, Collection<Integer> accountIndices);
//
//    /**
//     * Untag acconts.
//     *
//     * @param accountIndices are the indices of the accounts to untag
//     */
//    public void untagAccounts(Collection<Integer> accountIndices);
//
//    /**
//     * Return all account tags.
//     *
//     * @return the wallet's account tags
//     */
//    public List<MoneroAccountTag> getAccountTags();
//
//    /**
//     * Sets a human-readable description for a tag.
//     *
//     * @param tag is the tag to set a description for
//     * @param label is the label to set for the tag
//     */
//    public void setAccountTagLabel(string tag, string label);

    /**
     * Creates a payment URI from a send configuration.
     *
     * @param request specifies configuration for a potential tx
     * @return is the payment uri
     */
    string create_payment_uri(const monero_send_request& request) const;

    /**
     * Parses a payment URI to a send request.
     *
     * @param uri is the payment uri to parse
     * @return the send request parsed from the uri
     */
    shared_ptr<monero_send_request> parse_payment_uri(const string& uri) const;

    /**
     * Set an arbitrary attribute.
     *
     * @param key is the attribute key
     * @param val is the attribute value
     */
    void set_attribute(const string& key, const string& val);

    /**
     * Get an attribute.
     *
     * @param key is the attribute to get the value of
     * @return the attribute's value
     */
    string get_attribute(const string& key) const;

    /**
     * Start mining.
     *
     * @param num_threads is the number of threads created for mining (optional)
     * @param background_mining specifies if mining should occur in the background (optional)
     * @param ignore_battery specifies if the battery should be ignored for mining (optional)
     */
    void start_mining(boost::optional<uint64_t> num_threads, boost::optional<bool> background_mining, boost::optional<bool> ignore_battery);

    /**
     * Stop mining.
     */
    void stop_mining();

    /**
     * Wait for the next block to be added to the chain.
     *
     * @return the height of the next block when it is added to the chain
     */
    uint64_t wait_for_next_block();

    /**
     * Save the wallet at its current path.
     */
    void save();

    /**
     * Move the wallet from its current path to the given path.
     *
     * @param path is the new wallet's path
     * @param password is the new wallet's password
     */
    void move_to(string path, string password);

    /**
     * Close the wallet.
     */
    void close();

    /**
     * Indicates if importing multisig data is needed for returning a correct balance.
     *
     * @return true if importing multisig data is needed for returning a correct balance, false otherwise
     */
    bool is_multisig_import_needed() const;

    // bool is_multisig()

    /**
     * Get multisig info about this wallet.
     *
     * @return multisig info about this wallet
     */
    monero_multisig_info get_multisig_info();

    /**
     * Get multisig info as hex to share with participants to begin creating a
     * multisig wallet.
     *
     * @return this wallet's multisig hex to share with participants
     */
    string prepare_multisig();

    /**
     * Make this wallet multisig by importing multisig hex from participants.
     *
     * @param multisig_hexes are multisig hex from each participant
     * @param threshold is the number of signatures needed to sign transfers
     * @password is the wallet password
     * @return the result which has the multisig's address xor this wallet's multisig hex to share with participants iff not N/N
     */
    monero_multisig_init_result make_multisig(const vector<string>& multisig_hexes, int threshold, const string& password);

    /**
     * Finalize a N-1/N multisig wallet.
     *
     * TODO monero core: this is a special case of exchangeMultisigKeys() for N-1/N multisig.  use that as the last step instead and remove this?  that would further generalize the process
     *
     * @param multisig_hexes are multisig hex from each participant
     * @param password is the wallet's password // TODO monero core: redundant? wallet is created with password
     * @return the multisig wallet's address
     */
    string finalize_multisig(const vector<string>& multisig_hexes, const string& password);

    /**
     * Exchange multisig hex with participants in a M/N multisig wallet.
     *
     * This process must be repeated with participants exactly N-M times.
     *
     * @param multisig_hexes are multisig hex from each participant
     * @param password is the wallet's password // TODO monero core: redundant? wallet is created with password
     * @return the result which has the multisig's address xor this wallet's multisig hex to share with participants iff not done
     */
    monero_multisig_init_result exchange_multisig_keys(const vector<string>& mutisig_hexes, const string& password);

    /**
     * Export this wallet's multisig info as hex for other participants.
     *
     * @return this wallet's multisig info as hex for other participants
     */
    string get_multisig_hex();

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
    int import_multisig_hex(const vector<string>& multisig_hexes);

    /**
     * Sign previously created multisig transactions as represented by hex.
     *
     * @param multisig_tx_hex is the hex shared among the multisig transactions when they were created
     * @return the result of signing the multisig transactions
     */
    monero_multisig_sign_result sign_multisig_tx_hex(const string& multisig_tx_hex);

    /**
     * Submit signed multisig transactions as represented by a hex string.
     *
     * @param signed_multisig_tx_hex is the signed multisig hex returned from signMultisigTxs()
     * @return the resulting transaction ids
     */
    vector<string> submit_multisig_tx_hex(const string& signed_multisig_tx_hex);

    // --------------------------------- PRIVATE --------------------------------

  private:
    friend struct wallet2_listener;
    unique_ptr<tools::wallet2> m_w2;              // internal wallet implementation
    unique_ptr<wallet2_listener> m_w2_listener;   // internal wallet implementation listener
    set<monero_wallet_listener*> m_listeners;  // external wallet listeners

    void init_common();
    vector<monero_subaddress> get_subaddresses_aux(uint32_t account_idx, const vector<uint32_t>& subaddress_indices, const vector<tools::wallet2::transfer_details>& transfers) const;

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
