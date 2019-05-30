#include "daemon/MoneroDaemon.h"
#include "wallet/wallet2.h"

using namespace std;
using namespace monero;
using namespace crypto;



/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

  struct Wallet2Listener;

  // ----------------------------------- MODEL --------------------------------

  /**
   * Models a result of syncing a wallet.
   */
  struct MoneroSyncResult {
    uint64_t numBlocksFetched;
    bool receivedMoney;
    MoneroSyncResult() {}
    MoneroSyncResult(const uint64_t numBlocksFetched, const bool receivedMoney) : numBlocksFetched(numBlocksFetched), receivedMoney(receivedMoney) {}
  };

  /**
   * Models a Monero block header.
   */
  struct MoneroBlockHeader {
    uint64_t height;
  };

  /**
   * Models a Monero block.
   */
  struct MoneroBlock : public MoneroBlockHeader {
    // TODO
  };

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
     * @param startHeight is the starting height of the sync request
     * @param numBlocksDone is the number of blocks synced
     * @param numBlocksTotal is the total number of blocks to sync
     * @param percentDone is the sync progress as a percentage
     * @param message is a human-readable description of the current progress
     */
    virtual void onSyncProgress(uint64_t startHeight, uint64_t numBlocksDone, uint64_t numBlocksTotal, double percentDone, string& message) {}
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
     * Construct an unconnected English wallet with a randomly generated seed on mainnet.
     */
    MoneroWallet();

    /**
     * Construct a wallet with a randomly generated seed.
     *
     * @param networkType is the wallet's network type (default = MoneroNetworkType.MAINNET)
     * @param daemonConnection is connection information to a daemon (default = an unconnected wallet)
     * @param language is the wallet and mnemonic's language (default = "English")
     */
    MoneroWallet(const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, const string& language);

    /**
     * Construct a wallet from a mnemonic phrase.
     *
     * @param mnemonic is the mnemonic of the wallet to construct
     * @param networkType is the wallet's network type
     * @param daemonConnection is connection information to a daemon (default = an unconnected wallet)
     * @param restoreHeight is the block height to restore (i.e. scan the chain) from (default = 0)
     */
    MoneroWallet(const string& mnemonic, const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, uint64_t restoreHeight);

    /**
     * Construct a wallet from an address, view key, and spend key.
     *
     * @param address is the address of the wallet to construct
     * @param viewKey is the view key of the wallet to construct
     * @param spendKey is the spend key of the wallet to construct
     * @param networkType is the wallet's network type
     * @param daemonConnection is connection information to a daemon (default = an unconnected wallet)
     * @param restoreHeight is the block height to restore (i.e. scan the chain) from (default = 0)
     * @param language is the wallet and mnemonic's language (default = "English")
     */
    MoneroWallet(const string& address, const string& viewKey, const string& spendKey, const MoneroNetworkType networkType, const string& daemonConnection, uint64_t restoreHeight, const string& language);

    /**
     * Construct a wallet by opening a wallet file on disk.
     *
     * @param path is the path to the wallet file to open
     * @param password is the password of the wallet file to open
     * @param networkType is the wallet's network type
     */
    MoneroWallet(const string& path, const string& password, const MoneroNetworkType networkType);

    /**
     * Deconstructs the wallet.
     */
    ~MoneroWallet();

    /**
     * TODO: remove this.
     */
    tools::wallet2* getWallet2();

    /**
     * Set the wallet's daemon connection.
     *
     * TODO: switch to MoneroNetworkType
     *
     * @param uri is the daemon's URI
     * @param username is the daemon's username
     * @param password is the daemon's password
     */
    void setDaemonConnection(const string& uri, const string& username, const string& password);

    /**
     * TODO
     */
    MoneroRpcConnection getDaemonConnection() const;

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
     * TODO
     */
    string getLanguage() const;

//    /**
//     * Get a list of available languages for the wallet's seed.
//     *
//     * @return the available languages for the wallet's seed
//     */
//    virtual string[] getLanguages() const;

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

    /**
     * Get the wallet's primary address.
     *
     * @return the wallet's primary address
     */
    string getPrimaryAddress() const;

//    /**
//     * Get an integrated address based on this wallet's primary address and the
//     * given payment ID.  Generates a random payment ID if none is given.
//     *
//     * @param paymentId is the payment ID to generate an integrated address from (randomly generated if null)
//     * @return the integrated address
//     */
//    virtual MoneroIntegratedAddress getIntegratedAddress(const string& paymentId = "") const;
//
//    /**
//     * Decode an integrated address to get its standard address and payment id.
//     *
//     * @param integratedAddress is an integrated address to decode
//     * @return the decoded integrated address including standard address and payment id
//     */
//    virtual MoneroIntegratedAddress decodeIntegratedAddress(const string& integratedAddress = "") const;

    void setListener(MoneroWalletListener* listener);

    MoneroSyncResult sync();

    MoneroSyncResult sync(MoneroSyncListener& listener);

    MoneroSyncResult sync(uint64_t startHeight);

    MoneroSyncResult sync(uint64_t startHeight, MoneroSyncListener& listener);

//    /**
//     * Rescan the blockchain from scratch, losing any information which cannot be recovered from
//     * the blockchain itself.
//     *
//     * WARNING: This method discards local wallet data like destination addresses, tx secret keys,
//     * tx notes, etc.
//     */
//    public void rescanBlockchain();
//
//    /**
//     * Indicates if importing multisig data is needed for returning a correct balance.
//     *
//     * @return true if importing multisig data is needed for returning a correct balance, false otherwise
//     */
//    public boolean isMultisigImportNeeded();
//
//    /**
//     * Get all accounts.
//     *
//     * @return List<MoneroAccount> are all accounts within the wallet
//     */
//    public List<MoneroAccount> getAccounts();
//
//    /**
//     * Get all accounts.
//     *
//     * @param includeSubaddresses specifies if subaddresses should be included
//     * @return List<MoneroAccount> are all accounts
//     */
//    public List<MoneroAccount> getAccounts(boolean includeSubaddresses);
//
//    /**
//     * Get accounts with a given tag.
//     *
//     * @param tag is the tag for filtering accounts, all accounts if null
//     * @return List<MoneroAccount> are all accounts for the wallet with the given tag
//     */
//    public List<MoneroAccount> getAccounts(String tag);
//
//    /**
//     * Get accounts with a given tag.
//     *
//     * @param includeSubaddresses specifies if subaddresses should be included
//     * @param tag is the tag for filtering accounts, all accounts if null
//     * @return List<MoneroAccount> are all accounts for the wallet with the given tag
//     */
//    public List<MoneroAccount> getAccounts(boolean includeSubaddresses, String tag);
//
//    /**
//     * Get an account without subaddress information.
//     *
//     * @param accountIdx specifies the account to get
//     * @return the retrieved account
//     */
//    public MoneroAccount getAccount(int accountIdx);
//
//    /**
//     * Get an account.
//     *
//     * @param accountIdx specifies the account to get
//     * @param includeSubaddresses specifies if subaddresses should be included
//     * @return the retrieved account
//     */
//    public MoneroAccount getAccount(int accountIdx, boolean includeSubaddresses);
//
//    /**
//     * Create a new account without a label.
//     *
//     * @return the created account
//     */
//    public MoneroAccount createAccount();
//
//    /**
//     * Create a new account.
//     *
//     * @param label specifies the label for the account (optional)
//     * @return the created account
//     */
//    public MoneroAccount createAccount(String label);
//
//    /**
//     * Get all subaddresses in an account.
//     *
//     * @param accountIdx specifies the account to get subaddresses within
//     * @return List<MoneroSubaddress> are the retrieved subaddresses
//     */
//    public List<MoneroSubaddress> getSubaddresses(int accountIdx);
//
//    /**
//     * Get subaddresses in an account.
//     *
//     * @param accountIdx specifies the account to get subaddresses within
//     * @param subaddressIndices are specific subaddresses to get (optional)
//     * @return the retrieved subaddresses
//     */
//    public List<MoneroSubaddress> getSubaddresses(int accountIdx, List<Integer> subaddressIndices);
//
//    /**
//     * Get a subaddress.
//     *
//     * @param accountIdx specifies the index of the subaddress's account
//     * @param subaddressIdx specifies index of the subaddress within the account
//     * @return the retrieved subaddress
//     */
//    public MoneroSubaddress getSubaddress(int accountIdx, int subaddressIdx);
//
//    /**
//     * Create a subaddress within an account and without a label.
//     *
//     * @param accountIdx specifies the index of the account to create the subaddress within
//     * @return the created subaddress
//     */
//    public MoneroSubaddress createSubaddress(int accountIdx);
//
//    /**
//     * Create a subaddress within an account.
//     *
//     * @param accountIdx specifies the index of the account to create the subaddress within
//     * @param label specifies the the label for the subaddress (optional)
//     * @return the created subaddress
//     */
//    public MoneroSubaddress createSubaddress(int accountIdx, String label);

    /**
     * Get the address of a specific subaddress.
     *
     * @param accountIdx specifies the account index of the address's subaddress
     * @param subaddressIdx specifies the subaddress index within the account
     * @return the receive address of the specified subaddress
     */
    string getAddress(uint32_t accountIdx, uint32_t subaddressIdx) const;

//    /**
//     * Get the account and subaddress index of the given address.
//     *
//     * @param address is the address to get the account and subaddress index from
//     * @return the account and subaddress indices
//     * @throws exception if address is not a wallet address
//     */
//    public MoneroSubaddress getAddressIndex(String address);

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
    uint64_t getBalance(uint32_t accountIdx) const;

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
//
//    /**
//     * Get a wallet transaction by id.
//     *
//     * @param txId is an id of a transaction to get
//     * @return MoneroTxWallet is the identified transactions
//     */
//    public MoneroTxWallet getTx(String txId);
//
//    /**
//     * Get all wallet transactions.  Wallet transactions contain one or more
//     * transfers that are either incoming or outgoing to the wallet.
//     *
//     * @return all wallet transactions
//     */
//    public List<MoneroTxWallet> getTxs();
//
//    /**
//     * Get wallet transactions by id.
//     *
//     * @param txIds are ids of transactions to get
//     * @return List<MoneroTxWallet> are the identified transactions
//     */
//    public List<MoneroTxWallet> getTxs(String... txIds);
//
//    /**
//     * Get wallet transactions by id.
//     *
//     * @param txIds are ids of transactions to get
//     * @return List<MoneroTxWallet> are the identified transactions
//     */
//    public List<MoneroTxWallet> getTxs(Collection<String> txIds);
//
//    /**
//     * Get wallet transactions.  Wallet transactions contain one or more
//     * transfers that are either incoming or outgoing to the wallet.
//     *
//     * Query results can be filtered by passing in a transaction request.
//     * Transactions must meet every criteria defined in the request in order to
//     * be returned.  All filtering is optional and no filtering is applied when
//     * not defined.
//     *
//     * @param request filters query results (optional)
//     * @return wallet transactions per the request
//     */
//    public List<MoneroTxWallet> getTxs(MoneroTxRequest request);
//
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
//
//    /**
//     * Get incoming and outgoing transfers to and from this wallet.  An outgoing
//     * transfer represents a total amount sent from one or more subaddresses
//     * within an account to individual destination addresses, each with their
//     * own amount.  An incoming transfer represents a total amount received into
//     * a subaddress within an account.  Transfers belong to transactions which
//     * are stored on the blockchain.
//     *
//     * Query results can be filtered by passing in a MoneroTransferRequest.
//     * Transfers must meet every criteria defined in the request in order to be
//     * returned.  All filtering is optional and no filtering is applied when not
//     * defined.
//     *
//     * @param request filters query results (optional)
//     * @return wallet transfers per the request
//     */
//    public List<MoneroTransfer> getTransfers(MoneroTransferRequest request);
//
//    /**
//     * Get outputs created from previous transactions that belong to the wallet
//     * (i.e. that the wallet can spend one time).  Outputs are part of
//     * transactions which are stored in blocks on the blockchain.
//     *
//     * @return List<MoneroOutputWallet> are all wallet outputs
//     */
//    public List<MoneroOutputWallet> getOutputs();
//
//    /**
//     * Get outputs created from previous transactions that belong to the wallet
//     * (i.e. that the wallet can spend one time).  Outputs are part of
//     * transactions which are stored in blocks on the blockchain.
//     *
//     * Results can be configured by passing a MoneroOutputRequest.  Outputs must
//     * meet every criteria defined in the request in order to be returned.  All
//     * filtering is optional and no filtering is applied when not defined.
//     *
//     * @param request specifies request options (optional)
//     * @return List<MoneroOutputWallet> are wallet outputs per the request
//     */
//    public List<MoneroOutputWallet> getOutputs(MoneroOutputRequest request);
//
//    /**
//     * Get all signed key images.
//     *
//     * @return the wallet's signed key images
//     */
//    public List<MoneroKeyImage> getKeyImages();
//
//    /**
//     * Import signed key images and verify their spent status.
//     *
//     * @param keyImages are key images to import and verify (requires hex and signature)
//     * @return results of the import
//     */
//    public MoneroKeyImageImportResult importKeyImages(List<MoneroKeyImage> keyImages);
//
//    /**
//     * Get new key images from the last imported outputs.
//     *
//     * @return the key images from the last imported outputs
//     */
//    public List<MoneroKeyImage> getNewKeyImagesFromLastImport();
//
//    /**
//     * Create and relay (depending on configuration) a transaction which
//     * transfers funds from this wallet to one or more destination addresses.
//     *
//     * @param request configures the transaction
//     * @return the resulting transaction
//     */
//    public MoneroTxWallet send(MoneroSendRequest request);
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
//    public MoneroTxWallet send(int accountIndex, String address, BigInteger sendAmount);
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
//    public MoneroTxWallet send(int accountIndex, String address, BigInteger sendAmount, MoneroSendPriority priority);
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
//    public List<MoneroTxWallet> sendSplit(int accountIndex, String address, BigInteger sendAmount);
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
//    public List<MoneroTxWallet> sendSplit(int accountIndex, String address, BigInteger sendAmount, MoneroSendPriority priority);
//
//    /**
//     * Sweep an output with a given key image.
//     *
//     * @param request configures the sweep transaction
//     * @return the resulting transaction from sweeping an output
//     */
//    public MoneroTxWallet sweepOutput(MoneroSendRequest request);
//
//    /**
//     * Sweep an output with a given key image.
//     *
//     * @param address is the destination address to send to
//     * @param keyImage is the key image hex of the output to sweep
//     * @return the resulting transaction from sweeping an output
//     */
//    public MoneroTxWallet sweepOutput(String address, String keyImage);
//
//    /**
//     * Sweep an output with a given key image.
//     *
//     * @param address is the destination address to send to
//     * @param keyImage is the key image hex of the output to sweep
//     * @param priority is the transaction priority (optional)
//     * @return the resulting transaction from sweeping an output
//     */
//    public MoneroTxWallet sweepOutput(String address, String keyImage, MoneroSendPriority priority);
//
//    /**
//     * Sweep a subaddress's unlocked funds to an address.
//     *
//     * @param accountIdx is the index of the account
//     * @param subaddressIdx is the index of the subaddress
//     * @param address is the address to sweep the subaddress's funds to
//     * @return the resulting transactions
//     */
//    public List<MoneroTxWallet> sweepSubaddress(int accountIdx, int subaddressIdx, String address);
//
//    /**
//     * Sweep an acount's unlocked funds to an address.
//     *
//     * @param accountIdx is the index of the account
//     * @param address is the address to sweep the account's funds to
//     * @return the resulting transactions
//     */
//    public List<MoneroTxWallet> sweepAccount(int accountIdx, String address);
//
//    /**
//     * Sweep the wallet's unlocked funds to an address.
//     *
//     * @param address is the address to sweep the wallet's funds to
//     * @return the resulting transactions
//     */
//    public List<MoneroTxWallet> sweepWallet(String address);
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
//
//    /**
//     * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
//     *
//     * @param doNotRelay specifies if the resulting transaction should not be relayed (defaults to false i.e. relayed)
//     * @return the resulting transactions from sweeping dust
//     */
//    public List<MoneroTxWallet> sweepDust(boolean doNotRelay);
//
//    /**
//     * Relay a transaction previously created without relaying.
//     *
//     * @param txMetadata is transaction metadata previously created without relaying
//     * @return String is the id of the relayed tx
//     */
//    public String relayTx(String txMetadata);
//
//    /**
//     * Relay transactions previously created without relaying.
//     *
//     * @param txMetadatas are transaction metadata previously created without relaying
//     * @return List<String> are ids of the relayed txs
//     */
//    public List<String> relayTxs(Collection<String> txMetadatas);
//
//    /**
//     * Get a transaction note.
//     *
//     * @param txId specifies the transaction to get the note of
//     * @return the tx note
//     */
//    public String getTxNote(String txId);
//
//    /**
//     * Set a note for a specific transaction.
//     *
//     * @param txId specifies the transaction
//     * @param note specifies the note
//     */
//    public void setTxNote(String txId, String note);
//
//    /**
//     * Get notes for multiple transactions.
//     *
//     * @param txIds identify the transactions to get notes for
//     * @preturns notes for the transactions
//     */
//    public List<String> getTxNotes(Collection<String> txIds);
//
//    /**
//     * Set notes for multiple transactions.
//     *
//     * @param txIds specify the transactions to set notes for
//     * @param notes are the notes to set for the transactions
//     */
//    public void setTxNotes(Collection<String> txIds, Collection<String> notes);
//
//    /**
//     * Sign a message.
//     *
//     * @param msg is the message to sign
//     * @return the signature
//     */
//    public String sign(String msg);
//
//    /**
//     * Verify a signature on a message.
//     *
//     * @param msg is the signed message
//     * @param address is the signing address
//     * @param signature is the signature
//     * @return true if the signature is good, false otherwise
//     */
//    public boolean verify(String msg, String address, String signature);
//
//    /**
//     * Get a transaction's secret key from its id.
//     *
//     * @param txId is the transaction's id
//     * @return is the transaction's secret key
//     */
//    public String getTxKey(String txId);
//
//    /**
//     * Check a transaction in the blockchain with its secret key.
//     *
//     * @param txId specifies the transaction to check
//     * @param txKey is the transaction's secret key
//     * @param address is the destination public address of the transaction
//     * @return the result of the check
//     */
//    public MoneroCheckTx checkTxKey(String txId, String txKey, String address);
//
//    /**
//     * Get a transaction signature to prove it.
//     *
//     * @param txId specifies the transaction to prove
//     * @param address is the destination public address of the transaction
//     * @return the transaction signature
//     */
//    public String getTxProof(String txId, String address);
//
//    /**
//     * Get a transaction signature to prove it.
//     *
//     * @param txId specifies the transaction to prove
//     * @param address is the destination public address of the transaction
//     * @param message is a message to include with the signature to further authenticate the proof (optional)
//     * @return the transaction signature
//     */
//    public String getTxProof(String txId, String address, String message);
//
//    /**
//     * Prove a transaction by checking its signature.
//     *
//     * @param txId specifies the transaction to prove
//     * @param address is the destination public address of the transaction
//     * @param message is a message included with the signature to further authenticate the proof (optional)
//     * @param signature is the transaction signature to confirm
//     * @return the result of the check
//     */
//    public MoneroCheckTx checkTxProof(String txId, String address, String message, String signature);
//
//    /**
//     * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
//     *
//     * @param txId specifies the transaction to prove
//     * @return the transaction signature
//     */
//    public String getSpendProof(String txId);
//
//    /**
//     * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
//     *
//     * @param txId specifies the transaction to prove
//     * @param message is a message to include with the signature to further authenticate the proof (optional)
//     * @return the transaction signature
//     */
//    public String getSpendProof(String txId, String message);
//
//    /**
//     * Prove a spend using a signature. Unlike proving a transaction, it does not require the destination public address.
//     *
//     * @param txId specifies the transaction to prove
//     * @param message is a message included with the signature to further authenticate the proof (optional)
//     * @param signature is the transaction signature to confirm
//     * @return true if the signature is good, false otherwise
//     */
//    public boolean checkSpendProof(String txId, String message, String signature);
//
//    /**
//     * Generate a signature to prove the entire balance of the wallet.
//     *
//     * @param message is a message included with the signature to further authenticate the proof (optional)
//     * @return the reserve proof signature
//     */
//    public String getReserveProofWallet(String message);
//
//    /**
//     * Generate a signature to prove an available amount in an account.
//     *
//     * @param accountIdx specifies the account to prove contains an available amount
//     * @param amount is the minimum amount to prove as available in the account
//     * @param message is a message to include with the signature to further authenticate the proof (optional)
//     * @return the reserve proof signature
//     */
//    public String getReserveProofAccount(int accountIdx, BigInteger amount, String message);
//
//    /**
//     * Proves a wallet has a disposable reserve using a signature.
//     *
//     * @param address is the public wallet address
//     * @param message is a message included with the signature to further authenticate the proof (optional)
//     * @param signature is the reserve proof signature to check
//     * @return the result of checking the signature proof
//     */
//    public MoneroCheckReserve checkReserveProof(String address, String message, String signature);
//
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
//    public int addAddressBookEntry(String address, String description);
//
//    /**
//     * Add an address book entry.
//     *
//     * @param address is the entry address
//     * @param description is the entry description (optional)
//     * @param paymentId is the entry paymet id (optional)
//     * @return the index of the added entry
//     */
//    public int addAddressBookEntry(String address, String description, String paymentId);
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
//    public void tagAccounts(String tag, Collection<Integer> accountIndices);
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
//    public void setAccountTagLabel(String tag, String label);
//
//    /**
//     * Creates a payment URI from a send configuration.
//     *
//     * @param request specifies configuration for a potential tx
//     * @return is the payment uri
//     */
//    public String createPaymentUri(MoneroSendRequest request);
//
//    /**
//     * Parses a payment URI to a send configuration.
//     *
//     * @param uri is the payment uri to parse
//     * @return the send configuration parsed from the uri
//     */
//    public MoneroSendRequest parsePaymentUri(String uri);
//
//    /**
//     * Export all outputs in hex format.
//     *
//     * @return all outputs in hex format, null if no outputs
//     */
//    public String getOutputsHex();
//
//    /**
//     * Import outputs in hex format.
//     *
//     * @param outputsHex are outputs in hex format
//     * @return the number of outputs imported
//     */
//    public int importOutputsHex(String outputsHex);
//
//    /**
//     * Set an arbitrary attribute.
//     *
//     * @param key is the attribute key
//     * @param val is the attribute value
//     */
//    public void setAttribute(String key, String val);
//
//    /**
//     * Get an attribute.
//     *
//     * @param key is the attribute to get the value of
//     * @return the attribute's value
//     */
//    public String getAttribute(String key);
//
//    /**
//     * Start mining.
//     *
//     * @param numThreads is the number of threads created for mining (optional)
//     * @param backgroundMining specifies if mining should occur in the background (optional)
//     * @param ignoreBattery specifies if the battery should be ignored for mining (optional)
//     */
//    public void startMining(Integer numThreads, Boolean backgroundMining, Boolean ignoreBattery);
//
//    /**
//     * Stop mining.
//     */
//    public void stopMining();

    // --------------------------------- PRIVATE --------------------------------

    private:
     friend struct Wallet2Listener;
     shared_ptr<tools::wallet2> wallet2;		// internal wallet implementation
     unique_ptr<Wallet2Listener> wallet2Listener;	// listener for internal wallet implementation
     MoneroWalletListener* listener;			// wallet's external listener

     MoneroSyncResult syncAux(uint64_t* startHeight, uint64_t* endHeight, MoneroSyncListener* listener);
    };
}
