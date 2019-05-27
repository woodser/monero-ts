#include "daemon/MoneroDaemon.h"
#include "wallet/wallet2.h"

using namespace std;
using namespace monero;
using namespace crypto;

/**
 * Monero wallet interface.
 */
 class MoneroWallet {

  // --------------------------------- PUBLIC --------------------------------

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
  MoneroWallet(const string& mnemonic, const MoneroNetworkType networkType, const string& daemonConnection, uint64_t restoreHeight);

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
  MoneroWallet(const string& path, const epee::wipeable_string& password, const MoneroNetworkType networkType);

  /**
   * Deconstructs the wallet.
   */
  ~MoneroWallet();

  /**
   * Set the wallet's daemon connection.
   *
   * TODO: switch to MoneroNetworkType
   *
   * @param uri is the daemon's URI
   * @param username is the daemon's username
   * @param password is the daemon's password
   */
  void setDaemonConnection(const string& uri, const string& username, const epee::wipeable_string& password);

  MoneroRpcConnection getDaemonConnection();

  MoneroNetworkType getNetworkType();

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

 /**
  * Get the address of a specific subaddress.
  *
  * @param accountIdx specifies the account index of the address's subaddress
  * @param subaddressIdx specifies the subaddress index within the account
  * @return the receive address of the specified subaddress
  */
 string getAddress(uint32_t accountIdx, uint32_t subaddressIdx);

 // --------------------------------- PRIVATE --------------------------------

 private:
   tools::wallet2* wallet2;	// internal wallet implementation
 };
