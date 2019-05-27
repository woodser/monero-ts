#include "wallet/wallet2.h"

using namespace std;
using namespace crypto;
using namespace cryptonote;

//int main(int argc, const char* argv[]) {
//  cout << "===== MAIN =====" << endl;
//}

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
    MoneroWallet(network_type networkType, const string& daemonConnection, const string& language);

    /**
     * Construct a wallet from a mnemonic phrase.
     *
     * @param mnemonic is the mnemonic of the wallet to construct
     * @param networkType is the wallet's network type
     * @param daemonConnection is connection information to a daemon (default = an unconnected wallet)
     * @param restoreHeight is the block height to restore (i.e. scan the chain) from (default = 0)
     */
    MoneroWallet(const string& mnemonic, network_type networkType, const string& daemonConnection, uint64_t restoreHeight);

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
    MoneroWallet(const string& address, const string& viewKey, const string& spendKey, network_type networkType, const string& daemonConnection, uint64_t restoreHeight, const string& language);

    /**
     * Construct a wallet by opening a wallet file on disk.
     *
     * @param path is the path to the wallet file to open
     * @param password is the password of the wallet file to open
     * @param networkType is the wallet's network type
     */
    MoneroWallet(const string& path, const epee::wipeable_string& password, network_type networkType);

    /**
     * Deconstructs the wallet.
     */
    ~MoneroWallet();

    /**
     * Set the wallet's daemon connection.
     *
     * @param daemonUri is the daemon's URI
     * @param daemonUsername is the daemon's username
     * @param daemonPassword is the daemon's password
     */
    void setDaemonConnection(const string& daemonUri, const string& daemonUsername, const epee::wipeable_string& daemonPassword);

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

 private:
   tools::wallet2* wallet2;	// internal wallet implementation
 };
