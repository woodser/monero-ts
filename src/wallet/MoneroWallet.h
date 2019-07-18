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

#include "MoneroWalletModel.h"
#include "wallet/wallet2.h"

using namespace std;
using namespace crypto;
using namespace monero;

/**
 * Public library interface.
 */
namespace monero {

  // --------------------------------- LISTENERS ------------------------------

  //  class i_wallet2_callback
  //    {
  //    public:
  //      // Full wallet callbacks
  //      virtual void on_new_block(uint64_t height, const cryptonote::block& block) {}
  //      virtual void on_money_received(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& tx, uint64_t amount, const cryptonote::subaddress_index& subaddr_index) {}
  //      virtual void on_unconfirmed_money_received(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& tx, uint64_t amount, const cryptonote::subaddress_index& subaddr_index) {}
  //      virtual void on_money_spent(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& in_tx, uint64_t amount, const cryptonote::transaction& spend_tx, const cryptonote::subaddress_index& subaddr_index) {}
  //      virtual void on_skip_transaction(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& tx) {}
  //      virtual boost::optional<epee::wipeable_string> on_get_password(const char *reason) { return boost::none; }
  //      // Light wallet callbacks
  //      virtual void on_lw_new_block(uint64_t height) {}
  //      virtual void on_lw_money_received(uint64_t height, const crypto::hash &txid, uint64_t amount) {}
  //      virtual void on_lw_unconfirmed_money_received(uint64_t height, const crypto::hash &txid, uint64_t amount) {}
  //      virtual void on_lw_money_spent(uint64_t height, const crypto::hash &txid, uint64_t amount) {}
  //      // Device callbacks
  //      virtual void on_device_button_request(uint64_t code) {}
  //      virtual void on_device_button_pressed() {}
  //      virtual boost::optional<epee::wipeable_string> on_device_pin_request() { return boost::none; }
  //      virtual boost::optional<epee::wipeable_string> on_device_passphrase_request(bool on_device) { return boost::none; }
  //      virtual void on_device_progress(const hw::device_progress& event) {};
  //      // Common callbacks
  //      virtual void on_pool_tx_removed(const crypto::hash &txid) {}
  //      virtual ~i_wallet2_callback() {}
  //    };

  /**
   * Receives progress notifications as a wallet is synchronized.
   */
  class MoneroSyncListener {
  public:

    /**
     * Invoked when sync progress is made.
     *
     * @param height is the height of the synced block
     * @param startHeight is the starting height of the sync request
     * @param endHeight is the ending height of the sync request
     * @param percentDone is the sync progress as a percentage
     * @param message is a human-readable description of the current progress
     */
    virtual void onSyncProgress(uint64_t height, uint64_t startHeight, uint64_t endHeight, double percentDone, const string& message) {}
  };

  /**
   * Receives notifications as a wallet is updated.
   */
  class MoneroWalletListener : public MoneroSyncListener {
  public:

    /**
     * Invoked when a new block is processed.
     *
     * @param block is the newly processed block
     */
    virtual void onNewBlock(MoneroBlock& block) {};
  };

  // forward declaration of internal wallet2 listener
  struct Wallet2Listener;

  // ---------------------------- WALLET INTERFACE ----------------------------

  /**
   * Monero wallet interface.
   */
  class MoneroWallet {

  public:

    /**
     * Indicates if a wallet exists at the given path.
     *
     * @param path is the path to check for a wallet
     * @return true if a wallet exists at the given path, false otherwise
     */
    static bool walletExists(const string& path);

    /**
     * Open an existing wallet.
     *
     * @param path is the path to the wallet file to open
     * @param password is the password of the wallet file to open
     * @param networkType is the wallet's network type
     */
    MoneroWallet(const string& path, const string& password, const MoneroNetworkType networkType);

    /**
     * Create a new wallet with a randomly generated seed on mainnet in English.
     *
     * @param path is the path to create the wallet
     * @param password is the password encrypt the wallet
     */
    MoneroWallet(const string& path, const string& password);

    /**
     * Create a new wallet with a randomly generated seed.
     *
     * @param path is the path to create the wallet
     * @param password is the password encrypt the wallet
     * @param networkType is the wallet's network type (default = MoneroNetworkType.MAINNET)
     * @param daemonConnection is connection information to a daemon (default = an unconnected wallet)
     * @param language is the wallet and mnemonic's language (default = "English")
     */
    MoneroWallet(const string& path, const string& password, const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, const string& language);

    /**
     * Create a wallet from an existing mnemonic phrase.
     *
     * @param path is the path to create the wallet
     * @param password is the password encrypt the wallet
     * @param mnemonic is the mnemonic of the wallet to construct
     * @param networkType is the wallet's network type
     * @param daemonConnection is connection information to a daemon (default = an unconnected wallet)
     * @param restoreHeight is the block height to restore (i.e. scan the chain) from (default = 0)
     */
    MoneroWallet(const string& path, const string& password, const string& mnemonic, const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, uint64_t restoreHeight);

    /**
     * Create a wallet from an address, view key, and spend key.
     *
     * @param path is the path to create the wallet
     * @param password is the password encrypt the wallet
     * @param address is the address of the wallet to construct
     * @param viewKey is the view key of the wallet to construct
     * @param spendKey is the spend key of the wallet to construct
     * @param networkType is the wallet's network type
     * @param daemonConnection is connection information to a daemon (default = an unconnected wallet)
     * @param restoreHeight is the block height to restore (i.e. scan the chain) from (default = 0)
     * @param language is the wallet and mnemonic's language (default = "English")
     */
    MoneroWallet(const string& path, const string& password, const string& address, const string& viewKey, const string& spendKey, const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, uint64_t restoreHeight, const string& language);

    /**
     * Deconstruct the wallet.
     */
    ~MoneroWallet();

    /**
     * Set the wallet's daemon connection.
     *
     * @param uri is the daemon's URI
     * @param username is the daemon's username
     * @param password is the daemon's password
     */
    void setDaemonConnection(const string& uri, const string& username = "", const string& password = "");

    /**
     * Set the wallet's daemon connection.
     *
     * @param connection is the connection to set
     */
    void setDaemonConnection(const MoneroRpcConnection& connection);

    /**
     * TODO
     */
    shared_ptr<MoneroRpcConnection> getDaemonConnection() const;

    bool getIsConnected();

    uint64_t getDaemonHeight();

    uint64_t getDaemonTargetHeight();

    bool getIsDaemonSynced();

    bool getIsSynced();

    /**
     * TODO
     */
    string getPath() const;

    /**
     * TODO
     */
    MoneroNetworkType getNetworkType() const;

    /**
     * Get the wallet's seed.
     *
     * @return the wallet's seed
     */
    string getSeed() const;

    /**
     * Get the wallet's mnemonic phrase derived from the seed.
     *
     * @param mnemonic is assigned the wallet's mnemonic phrase
     */
    string getMnemonic() const;

    /**
     * Get the language of the wallet's mnemonic phrase.
     *
     * @return the language of the wallet's mnemonic phrase
     */
    string getLanguage() const;

    /**
     * Get a list of available languages for the wallet's mnemonic phrase.
     *
     * @return the available languages for the wallet's mnemonic phrase
     */
    vector<string> getLanguages() const;

    /**
     * Get the wallet's public view key.
     *
     * @return the wallet's public view key
     */
    string getPublicViewKey() const;

    /**
     * Get the wallet's private view key.
     *
     * @return the wallet's private view key
     */
    string getPrivateViewKey() const;

    /**
     * Get the wallet's public spend key.
     *
     * @return the wallet's public spend key
     */
    string getPublicSpendKey() const;

    /**
     * Get the wallet's private spend key.
     *
     * @return the wallet's private spend key
     */
    string getPrivateSpendKey() const;

    /**
     * Get the wallet's primary address.
     *
     * @return the wallet's primary address
     */
    string getPrimaryAddress() const;

    /**
     * Get the address of a specific subaddress.
     *
     * @param accountIdx specifies the account index of the address's subaddress
     * @param subaddressIdx specifies the subaddress index within the account
     * @return the receive address of the specified subaddress
     */
    string getAddress(const uint32_t accountIdx, const uint32_t subaddressIdx) const;

    /**
     * Get the account and subaddress index of the given address.
     *
     * @param address is the address to get the account and subaddress index from
     * @return the account and subaddress indices
     * @throws exception if address is not a wallet address
     */
    MoneroSubaddress getAddressIndex(const string& address) const;

    /**
     * Get an integrated address from a standard address and a payment id.
     *
     * @param standardAddress is the integrated addresse's standard address (defaults to wallet's primary address)
     * @param paymentId is the integrated addresse's payment id (defaults to randomly generating new payment id)
     * @return the integrated address
     */
    MoneroIntegratedAddress getIntegratedAddress(const string& standardAddress = "", const string& paymentId = "") const;

    /**
     * Decode an integrated address to get its standard address and payment id.
     *
     * @param integratedAddress is an integrated address to decode
     * @return the decoded integrated address including standard address and payment id
     */
    MoneroIntegratedAddress decodeIntegratedAddress(const string& integratedAddress) const;

    void setListener(boost::optional<MoneroWalletListener&> listener);

    MoneroSyncResult sync();

    MoneroSyncResult sync(MoneroSyncListener& listener);

    MoneroSyncResult sync(uint64_t startHeight);

    MoneroSyncResult sync(uint64_t startHeight, MoneroSyncListener& listener);

    /**
     * Enable or disable automatic synchronization.
     *
     * @param autoSync specifies if automatic synchronization is enabled or disabled
     */
    void setAutoSync(bool autoSync);

    //    /**
    //     * Rescan the blockchain from scratch, losing any information which cannot be recovered from
    //     * the blockchain itself.
    //     *
    //     * WARNING: This method discards local wallet data like destination addresses, tx secret keys,
    //     * tx notes, etc.
    //     */
    //    public void rescanBlockchain();

    /**
     * Get the height of the last block processed by the wallet (its index + 1).
     *
     * @return the height of the last block processed by the wallet
     */
    uint64_t getHeight() const;

    /**
     * Get the blockchain's height.
     *
     * @return the blockchain's height
     */
    uint64_t getChainHeight() const;

    uint64_t getRestoreHeight() const;

    void setRestoreHeight(uint64_t restoreHeight);

    //
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
    uint64_t getBalance() const;

    /**
     * Get an account's balance.
     *
     * @param accountIdx is the index of the account to get the balance of
     * @return the account's balance
     */
    uint64_t getBalance(uint32_t accountIdx) const;	// TODO: this param should be const and others

    /**
     * Get a subaddress's balance.
     *
     * @param accountIdx is the index of the subaddress's account to get the balance of
     * @param subaddressIdx is the index of the subaddress to get the balance of
     * @return the subaddress's balance
     */
    uint64_t getBalance(uint32_t accountIdx, uint32_t subaddressIdx) const;

    /**
     * Get the wallet's unlocked balance.
     *
     * @return the wallet's unlocked balance
     */
    uint64_t getUnlockedBalance() const;

    /**
     * Get an account's unlocked balance.
     *
     * @param accountIdx is the index of the account to get the unlocked balance of
     * @return the account's unlocked balance
     */
    uint64_t getUnlockedBalance(uint32_t accountIdx) const;

    /**
     * Get a subaddress's unlocked balance.
     *
     * @param accountIdx is the index of the subaddress's account to get the unlocked balance of
     * @param subaddressIdx is the index of the subaddress to get the unlocked balance of
     * @return the subaddress's balance
     */
    uint64_t getUnlockedBalance(uint32_t accountIdx, uint32_t subaddressIdx) const;

    /**
     * Get all accounts.
     *
     * @return List<MoneroAccount> are all accounts within the wallet
     */
    vector<MoneroAccount> getAccounts() const;

    /**
     * Get all accounts.
     *
     * @param includeSubaddresses specifies if subaddresses should be included
     * @return List<MoneroAccount> are all accounts
     */
    vector<MoneroAccount> getAccounts(const bool includeSubaddresses) const;

    /**
     * Get accounts with a given tag.
     *
     * @param tag is the tag for filtering accounts, all accounts if null
     * @return List<MoneroAccount> are all accounts for the wallet with the given tag
     */
    vector<MoneroAccount> getAccounts(const string& tag) const;

    /**
     * Get accounts with a given tag.
     *
     * @param includeSubaddresses specifies if subaddresses should be included
     * @param tag is the tag for filtering accounts, all accounts if null
     * @return List<MoneroAccount> are all accounts for the wallet with the given tag
     */
    vector<MoneroAccount> getAccounts(const bool includeSubaddresses, const string& tag) const;

    /**
     * Get an account without subaddress information.
     *
     * @param accountIdx specifies the account to get
     * @return the retrieved account
     */
    MoneroAccount getAccount(uint32_t accountIdx) const;

    /**
     * Get an account.
     *
     * @param accountIdx specifies the account to get
     * @param includeSubaddresses specifies if subaddresses should be included
     * @return the retrieved account
     */
    MoneroAccount getAccount(const uint32_t accountIdx, const bool includeSubaddresses) const;

    /**
     * Create a new account with a label for the first subaddress.
     *
     * @param label specifies the label for the account's first subaddress (optional)
     * @return the created account
     */
    MoneroAccount createAccount(const string& label = "");

    /**
     * Get all subaddresses in an account.
     *
     * @param accountIdx specifies the account to get subaddresses within
     * @return List<MoneroSubaddress> are the retrieved subaddresses
     */
    vector<MoneroSubaddress> getSubaddresses(const uint32_t accountIdx) const;

    /**
     * Get subaddresses in an account.
     *
     * @param accountIdx specifies the account to get subaddresses within
     * @param subaddressIndices are specific subaddresses to get (optional)
     * @return the retrieved subaddresses
     */
    vector<MoneroSubaddress> getSubaddresses(const uint32_t accountIdx, const vector<uint32_t> subaddressIndices) const;

    /**
     * Get a subaddress.
     *
     * @param accountIdx specifies the index of the subaddress's account
     * @param subaddressIdx specifies index of the subaddress within the account
     * @return the retrieved subaddress
     */
    MoneroSubaddress getSubaddress(const uint32_t accountIdx, const uint32_t subaddressIdx) const;

    /**
     * Create a subaddress within an account.
     *
     * @param accountIdx specifies the index of the account to create the subaddress within
     * @param label specifies the the label for the subaddress (defaults to empty string)
     * @return the created subaddress
     */
    MoneroSubaddress createSubaddress(uint32_t accountIdx, const string& label = "");

//    /**
//     * Get a wallet transaction by id.
//     *
//     * @param txId is an id of a transaction to get
//     * @return MoneroTxWallet is the identified transactions
//     */
//    public MoneroTxWallet getTx(string txId);
//
    /**
     * Get all wallet transactions.  Wallet transactions contain one or more
     * transfers that are either incoming or outgoing to the wallet.
     *
     * @return all wallet transactions
     */
    vector<shared_ptr<MoneroTxWallet>> getTxs() const;
//
//    /**
//     * Get wallet transactions by id.
//     *
//     * @param txIds are ids of transactions to get
//     * @return List<MoneroTxWallet> are the identified transactions
//     */
//    public List<MoneroTxWallet> getTxs(string... txIds);
//
//    /**
//     * Get wallet transactions by id.
//     *
//     * @param txIds are ids of transactions to get
//     * @return List<MoneroTxWallet> are the identified transactions
//     */
//    public List<MoneroTxWallet> getTxs(Collection<string> txIds);

    /**
     * Get wallet transactions.  Wallet transactions contain one or more
     * transfers that are either incoming or outgoing to the wallet.
     *
     * Query results can be filtered by passing in a transaction request.
     * Transactions must meet every criteria defined in the request in order to
     * be returned.  All filtering is optional and no filtering is applied when
     * not defined.
     * 
     * TODO: request should be const
     *
     * @param request filters query results (optional)
     * @return wallet transactions per the request
     */
    vector<shared_ptr<MoneroTxWallet>> getTxs(MoneroTxRequest& request) const;

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
//    public List<MoneroTransfer> getTransfers();
//
//    /**
//     * Get incoming and outgoing transfers to and from an account.  An outgoing
//     * transfer represents a total amount sent from one or more subaddresses
//     * within an account to individual destination addresses, each with their
//     * own amount.  An incoming transfer represents a total amount received into
//     * a subaddress within an account.  Transfers belong to transactions which
//     * are stored on the blockchain.
//     *
//     * @param accountIdx is the index of the account to get transfers from
//     * @return transfers to/from the account
//     */
//    public List<MoneroTransfer> getTransfers(int accountIdx);
//
//    /**
//     * Get incoming and outgoing transfers to and from a subaddress.  An outgoing
//     * transfer represents a total amount sent from one or more subaddresses
//     * within an account to individual destination addresses, each with their
//     * own amount.  An incoming transfer represents a total amount received into
//     * a subaddress within an account.  Transfers belong to transactions which
//     * are stored on the blockchain.
//     *
//     * @param accountIdx is the index of the account to get transfers from
//     * @param subaddressIdx is the index of the subaddress to get transfers from
//     * @return transfers to/from the subaddress
//     */
//    public List<MoneroTransfer> getTransfers(int accountIdx, int subaddressIdx);

    /**
     * Get incoming and outgoing transfers to and from this wallet.  An outgoing
     * transfer represents a total amount sent from one or more subaddresses
     * within an account to individual destination addresses, each with their
     * own amount.  An incoming transfer represents a total amount received into
     * a subaddress within an account.  Transfers belong to transactions which
     * are stored on the blockchain.
     *
     * Query results can be filtered by passing in a MoneroTransferRequest.
     * Transfers must meet every criteria defined in the request in order to be
     * returned.  All filtering is optional and no filtering is applied when not
     * defined.
     *
     * @param request filters query results (optional)
     * @return wallet transfers per the request
     */
    vector<shared_ptr<MoneroTransfer>> getTransfers(const MoneroTransferRequest& request) const;

//    void getTransfers(const MoneroTransferRequest& request, vector<MoneroTransfer>& transfers) const;

//    /**
//     * Get outputs created from previous transactions that belong to the wallet
//     * (i.e. that the wallet can spend one time).  Outputs are part of
//     * transactions which are stored in blocks on the blockchain.
//     *
//     * @return List<MoneroOutputWallet> are all wallet outputs
//     */
//    public List<MoneroOutputWallet> getOutputs();

    /**
     * Get outputs created from previous transactions that belong to the wallet
     * (i.e. that the wallet can spend one time).  Outputs are part of
     * transactions which are stored in blocks on the blockchain.
     *
     * Results can be configured by passing a MoneroOutputRequest.  Outputs must
     * meet every criteria defined in the request in order to be returned.  All
     * filtering is optional and no filtering is applied when not defined.
     *
     * @param request specifies request options (optional)
     * @return List<MoneroOutputWallet> are wallet outputs per the request
     */
    vector<shared_ptr<MoneroOutputWallet>> getOutputs(const MoneroOutputRequest& request) const;

    /**
     * Export all outputs in hex format.
     *
     * @return all outputs in hex format, empty string if no outputs
     */
    string getOutputsHex() const;

    /**
     * Import outputs in hex format.
     *
     * @param outputsHex are outputs in hex format
     * @return the number of outputs imported
     */
    int importOutputsHex(const string& outputsHex);

    /**
     * Get all signed key images.
     *
     * @return the wallet's signed key images
     */
    vector<shared_ptr<MoneroKeyImage>> getKeyImages() const;

    /**
     * Import signed key images and verify their spent status.
     *
     * @param keyImages are key images to import and verify (requires hex and signature)
     * @return results of the import
     */
    shared_ptr<MoneroKeyImageImportResult> importKeyImages(const vector<shared_ptr<MoneroKeyImage>>& keyImages);

//    /**
//     * Get new key images from the last imported outputs.
//     *
//     * @return the key images from the last imported outputs
//     */
//    public List<MoneroKeyImage> getNewKeyImagesFromLastImport();

    /**
     * Create one or more transactions which transfer funds from this wallet to
     * one or more destinations depending on the given configuration.
     *
     * @param request configures the transaction
     * @return the resulting transaction
     */
    vector<shared_ptr<MoneroTxWallet>> sendSplit(const MoneroSendRequest& request);

//
//    /**
//     * Create and relay a transaction which transfers funds from this wallet to
//     * a destination address.
//     *
//     * @param accountIndex is the index of the account to draw funds from
//     * @param address is the destination address to send funds to
//     * @param sendAmount is the amount being sent
//     * @return the resulting transaction
//     */
//    public MoneroTxWallet send(int accountIndex, string address, BigInteger sendAmount);
//
//    /**
//     * Create and relay a transaction which transfers funds from this wallet to
//     * a destination address.
//     *
//     * @param accountIndex is the index of the account to draw funds from
//     * @param address is the destination address to send funds to
//     * @param sendAmount is the amount being sent
//     * @param priority is the send priority (default normal)
//     * @return the resulting transaction
//     */
//    public MoneroTxWallet send(int accountIndex, string address, BigInteger sendAmount, MoneroSendPriority priority);
//
//    /**
//     * Create and relay (depending on configuration) one or more transactions
//     * which transfer funds from this wallet to one or more destination.
//     *
//     * @param request configures the transactions
//     * @return the resulting transactions
//     */
//    public List<MoneroTxWallet> sendSplit(MoneroSendRequest request);
//
//    /**
//     * Create and relay one or more transactions which transfer funds from this
//     * wallet to one or more destination.
//     *
//     * @param accountIndex is the index of the account to draw funds from
//     * @param address is the destination address to send funds to
//     * @param sendAmount is the amount being sent
//     * @return the resulting transactions
//     */
//    public List<MoneroTxWallet> sendSplit(int accountIndex, string address, BigInteger sendAmount);
//
//    /**
//     * Create and relay one or more transactions which transfer funds from this
//     * wallet to one or more destination.
//     *
//     * @param accountIndex is the index of the account to draw funds from
//     * @param address is the destination address to send funds to
//     * @param sendAmount is the amount being sent
//     * @param priority is the send priority (default normal)
//     * @return the resulting transactions
//     */
//    public List<MoneroTxWallet> sendSplit(int accountIndex, string address, BigInteger sendAmount, MoneroSendPriority priority);

    /**
     * Sweep an output with a given key image.
     *
     * @param request configures the sweep transaction
     * @return the resulting transaction from sweeping an output
     */
    shared_ptr<MoneroTxWallet> sweepOutput(const MoneroSendRequest& request) const;

//    /**
//     * Sweep an output with a given key image.
//     *
//     * @param address is the destination address to send to
//     * @param keyImage is the key image hex of the output to sweep
//     * @return the resulting transaction from sweeping an output
//     */
//    public MoneroTxWallet sweepOutput(string address, string keyImage);
//
//    /**
//     * Sweep an output with a given key image.
//     *
//     * @param address is the destination address to send to
//     * @param keyImage is the key image hex of the output to sweep
//     * @param priority is the transaction priority (optional)
//     * @return the resulting transaction from sweeping an output
//     */
//    public MoneroTxWallet sweepOutput(string address, string keyImage, MoneroSendPriority priority);
//
//    /**
//     * Sweep a subaddress's unlocked funds to an address.
//     *
//     * @param accountIdx is the index of the account
//     * @param subaddressIdx is the index of the subaddress
//     * @param address is the address to sweep the subaddress's funds to
//     * @return the resulting transactions
//     */
//    public List<MoneroTxWallet> sweepSubaddress(int accountIdx, int subaddressIdx, string address);
//
//    /**
//     * Sweep an acount's unlocked funds to an address.
//     *
//     * @param accountIdx is the index of the account
//     * @param address is the address to sweep the account's funds to
//     * @return the resulting transactions
//     */
//    public List<MoneroTxWallet> sweepAccount(int accountIdx, string address);
//
//    /**
//     * Sweep the wallet's unlocked funds to an address.
//     *
//     * @param address is the address to sweep the wallet's funds to
//     * @return the resulting transactions
//     */
//    public List<MoneroTxWallet> sweepWallet(string address);
//
//    /**
//     * Sweep all unlocked funds according to the given request.
//     *
//     * @param request is the sweep configuration
//     * @return the resulting transactions
//     */
//    public List<MoneroTxWallet> sweepAllUnlocked(MoneroSendRequest request);
//
//    /**
//     * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
//     *
//     * NOTE: Dust only exists pre RCT, so this method will return "no dust to sweep" on new wallets.
//     *
//     * @return the resulting transactions from sweeping dust
//     */
//    public List<MoneroTxWallet> sweepDust();

    /**
     * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
     *
     * @param doNotRelay specifies if the resulting transaction should not be relayed (defaults to false i.e. relayed)
     * @return the resulting transactions from sweeping dust
     */
    vector<shared_ptr<MoneroTxWallet>> sweepDust(bool doNotRelay = false);
//
//    /**
//     * Relay a transaction previously created without relaying.
//     *
//     * @param txMetadata is transaction metadata previously created without relaying
//     * @return string is the id of the relayed tx
//     */
//    public string relayTx(string txMetadata);

    /**
     * Relay transactions previously created without relaying.
     *
     * @param txMetadatas are transaction metadata previously created without relaying
     * @return the ids of the relayed txs
     */
    vector<string> relayTxs(const vector<string>& txMetadatas);

    /**
     * Get a transaction note.
     *
     * @param txId specifies the transaction to get the note of
     * @return the tx note
     */
    string getTxNote(const string& txId) const;

    /**
     * Get notes for multiple transactions.
     *
     * @param txIds identify the transactions to get notes for
     * @preturns notes for the transactions
     */
    vector<string> getTxNotes(const vector<string>& txIds) const;

    /**
     * Set a note for a specific transaction.
     *
     * @param txId specifies the transaction
     * @param note specifies the note
     */
    void setTxNote(const string& txId, const string& note);

    /**
     * Set notes for multiple transactions.
     *
     * @param txIds specify the transactions to set notes for
     * @param notes are the notes to set for the transactions
     */
    void setTxNotes(const vector<string>& txIds, const vector<string>& notes);

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
     * @param txId is the transaction's id
     * @return is the transaction's secret key
     */
    string getTxKey(const string& txId) const;

    /**
     * Check a transaction in the blockchain with its secret key.
     *
     * @param txId specifies the transaction to check
     * @param txKey is the transaction's secret key
     * @param address is the destination public address of the transaction
     * @return the result of the check
     */
    shared_ptr<MoneroCheckTx> checkTxKey(const string& txId, const string& txKey, const string& address) const;

//    /**
//     * Get a transaction signature to prove it.
//     *
//     * @param txId specifies the transaction to prove
//     * @param address is the destination public address of the transaction
//     * @return the transaction signature
//     */
//    string getTxProof(const string& txId, const string& address) const;

    /**
     * Get a transaction signature to prove it.
     *
     * @param txId specifies the transaction to prove
     * @param address is the destination public address of the transaction
     * @param message is a message to include with the signature to further authenticate the proof (optional)
     * @return the transaction signature
     */
    string getTxProof(const string& txId, const string& address, const string& message) const;

    /**
     * Prove a transaction by checking its signature.
     *
     * @param txId specifies the transaction to prove
     * @param address is the destination public address of the transaction
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @param signature is the transaction signature to confirm
     * @return the result of the check
     */
    shared_ptr<MoneroCheckTx> checkTxProof(const string& txId, const string& address, const string& message, const string& signature) const;

//    /**
//     * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
//     *
//     * @param txId specifies the transaction to prove
//     * @return the transaction signature
//     */
//    string getSpendProof(const string& txId) const;

    /**
     * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
     *
     * @param txId specifies the transaction to prove
     * @param message is a message to include with the signature to further authenticate the proof (optional)
     * @return the transaction signature
     */
    string getSpendProof(const string& txId, const string& message) const;

    /**
     * Prove a spend using a signature. Unlike proving a transaction, it does not require the destination public address.
     *
     * @param txId specifies the transaction to prove
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @param signature is the transaction signature to confirm
     * @return true if the signature is good, false otherwise
     */
    bool checkSpendProof(const string& txId, const string& message, const string& signature) const;

    /**
     * Generate a signature to prove the entire balance of the wallet.
     *
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @return the reserve proof signature
     */
    string getReserveProofWallet(const string& message) const;

    /**
     * Generate a signature to prove an available amount in an account.
     *
     * @param accountIdx specifies the account to prove ownership of the amount
     * @param amount is the minimum amount to prove as available in the account
     * @param message is a message to include with the signature to further authenticate the proof (optional)
     * @return the reserve proof signature
     */
    string getReserveProofAccount(uint32_t accountIdx, uint64_t amount, const string& message) const;

    /**
     * Proves a wallet has a disposable reserve using a signature.
     *
     * @param address is the public wallet address
     * @param message is a message included with the signature to further authenticate the proof (optional)
     * @param signature is the reserve proof signature to check
     * @return the result of checking the signature proof
     */
    shared_ptr<MoneroCheckReserve> checkReserveProof(const string& address, const string& message, const string& signature) const;

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
//     * @param paymentId is the entry paymet id (optional)
//     * @return the index of the added entry
//     */
//    public int addAddressBookEntry(string address, string description, string paymentId);
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
    string createPaymentUri(const MoneroSendRequest& request) const;

    /**
     * Parses a payment URI to a send request.
     *
     * @param uri is the payment uri to parse
     * @return the send request parsed from the uri
     */
    shared_ptr<MoneroSendRequest> parsePaymentUri(const string& uri) const;

    /**
     * Set an arbitrary attribute.
     *
     * @param key is the attribute key
     * @param val is the attribute value
     */
    void setAttribute(const string& key, const string& val);

    /**
     * Get an attribute.
     *
     * @param key is the attribute to get the value of
     * @return the attribute's value
     */
    string getAttribute(const string& key) const;

    /**
     * Start mining.
     *
     * @param numThreads is the number of threads created for mining (optional)
     * @param backgroundMining specifies if mining should occur in the background (optional)
     * @param ignoreBattery specifies if the battery should be ignored for mining (optional)
     */
    void startMining(boost::optional<uint64_t> numThreads, boost::optional<bool> backgroundMining, boost::optional<bool> ignoreBattery);

    /**
     * Stop mining.
     */
    void stopMining();

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
    void moveTo(string path, string password);

    /**
     * Close the wallet.
     */
    void close();

    // --------------------------------- PRIVATE --------------------------------

  private:
    friend struct Wallet2Listener;
    unique_ptr<tools::wallet2> wallet2;               // internal wallet implementation
    unique_ptr<Wallet2Listener> wallet2Listener;	    // listener for internal wallet implementation
    boost::optional<MoneroWalletListener&> listener = boost::none;  // wallet's external listener

    void initCommon();
    MoneroSyncResult syncAux(boost::optional<uint64_t> startHeight, boost::optional<uint64_t> endHeight, boost::optional<MoneroSyncListener&> listener);
    vector<MoneroSubaddress> getSubaddressesAux(uint32_t accountIdx, vector<uint32_t> subaddressIndices, const vector<tools::wallet2::transfer_details>& transfers) const;

    // sync thread management
    mutable std::atomic<bool> isSynced;       // whether or not wallet is synced
    mutable std::atomic<bool> isConnected;    // cache connection status to avoid unecessary RPC calls
    boost::condition_variable syncCV;         // to awaken sync threads
    std::mutex syncMutex;                     // synchronize sync() and syncAsync() requests
    std::atomic<bool> rescanOnSync;           // whether or not to rescan on sync
    std::atomic<bool> autoSyncEnabled;        // whether or not auto sync is enabled
    std::atomic<int> autoSyncIntervalMillis;  // auto sync loop inteval
    boost::thread autoSyncThread;             // thread for auto sync loop
    std::mutex autoSyncMutex;                 // synchronize auto sync loop
    std::atomic<bool> autoSyncThreadDone;     // whether or not auto sync loop is done (cannot be re-started)
    void autoSyncThreadFunc();                // function to run auto sync loop thread
    void doSync();                            // internal synchronized sync function
  };
}
