#include "daemon/MoneroDaemon.h"
#include "wallet/wallet2.h"

using namespace std;
using namespace monero;
using namespace crypto;

/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

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
    virtual void onSyncProgress(uint64_t startHeight, uint64_t numBlocksDone, uint64_t numBlocksTotal, double percentDone, string message) {}
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
     * TODO
     */
    string getLanguage() const;

  //   /**
  //    * Get the wallet's seed.
  //    *
  //    * @return the wallet's seed
  //    */
  //   const string getSeed();

   /**
    * Get the wallet's mnemonic phrase derived from the seed.
    *
    * @param mnemonic is assigned the wallet's mnemonic phrase
    */
   string getMnemonic() const;

   /**
    * Get the height of the last block processed by the wallet (its index + 1).
    *
    * @return the height of the last block processed by the wallet
    */
   uint64_t getHeight() const;

   /**
    * Get the blockchain's height.
    *
    * @return the block chain's height
    */
   uint64_t getChainHeight() const;

   uint64_t getRestoreHeight() const;

   void setListener(MoneroWalletListener* listener);

   MoneroSyncResult sync();

   MoneroSyncResult sync(MoneroSyncListener& listener);

   MoneroSyncResult sync(uint64_t startHeight);

   MoneroSyncResult sync(uint64_t startHeight, MoneroSyncListener& listener);

   /**
    * Get the address of a specific subaddress.
    *
    * @param accountIdx specifies the account index of the address's subaddress
    * @param subaddressIdx specifies the subaddress index within the account
    * @return the receive address of the specified subaddress
    */
   string getAddress(uint32_t accountIdx, uint32_t subaddressIdx) const;

   // --------------------------------- PRIVATE --------------------------------

   private:
     unique_ptr<tools::wallet2> wallet2;		// internal wallet implementation
     MoneroWalletListener* listener;			// wallet's assigned listener
     uint64_t* syncStartHeight;				// start height when sync is invoked for notifications
     unique_ptr<MoneroSyncListener> syncListener;	// listener when sync is invoked for notifications

     MoneroSyncResult syncAux(uint64_t* startHeight, uint64_t* endHeight, MoneroSyncListener* listener);
   };
}
