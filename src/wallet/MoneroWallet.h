using namespace std;
using namespace crypto;
using namespace cryptonote;

/**
 * Monero wallet interface.
 *
 * TODO: daemonConnection is object with uri, username, and password
 */
 class MoneroWallet {

   // --------------------------------- PUBLIC --------------------------------

 public:

    /**
     * Construct a wallet with a randomly generated seed.
     */
    MoneroWallet();

    /**
     * Construct a wallet with a randomly generated seed.
     *
     * @param networkType is the wallet's network type (default = MoneroNetworkType.MAINNET)
     * @param daemonConnection is connection information to a daemon (default = an unconnected wallet)
     * @param language is the wallet and mnemonic's language (default = "English")
     */
    MoneroWallet(network_type networkType, string daemonConnection, string language);

    /**
     * Construct a wallet from a mnemonic phrase.
     *
     * @param mnemonic is the mnemonic of the wallet to construct
     * @param networkType is the wallet's network type
     * @param daemonConnection is connection information to a daemon (default = an unconnected wallet)
     * @param restoreHeight is the block height to restore (i.e. scan the chain) from (default = 0)
     */
    MoneroWallet(string mnemonic, network_type networkType, string daemonConnection, uint64_t restoreHeight);

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
    MoneroWallet(string address, string viewKey, string spendKey, network_type networkType, string daemonConnection, uint64_t restoreHeight, string language);

    /**
     * Construct a wallet by opening a wallet file on disk.
     *
     * @param path is the path to the wallet file to open
     * @param password is the password of the wallet file to open
     * @param networkType is the wallet's network type
     */
    MoneroWallet(string path, string password, network_type networkType);

    /**
     * Deconstructs the wallet.
     */
    ~MoneroWallet();

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
   void getMnemonic(epee::wipeable_string& mnemonic) const;

   // --------------------------------- PRIVATE --------------------------------

 };
