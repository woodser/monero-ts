#include "MoneroWallet.h"

#include <stdio.h>
#include <iostream>
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"

using namespace cryptonote;

/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

  /**
   * Listens to wallet2 notifications in order to facilitate external wallet notifications.
   */
  struct Wallet2Listener : public tools::i_wallet2_callback {

  public:

    Wallet2Listener(MoneroWallet* wallet, shared_ptr<tools::wallet2> wallet2) {
      this->wallet = wallet;
      this->wallet2 = wallet2;
      cout << "syncStartHeight: " << syncStartHeight << ", syncEndHeight: " << syncEndHeight << endl;
    }

    ~Wallet2Listener() {

    }

    void setWalletListener(MoneroWalletListener* listener) {
      this->listener = listener;
      updateListening();
    }

    void onSyncStart(uint64_t startHeight, MoneroSyncListener* syncListener) {
      syncStartHeight = new uint64_t(startHeight);
      this->syncListener = syncListener;
      updateListening();
    }

    void onSyncEnd() {
      delete syncStartHeight;
      syncStartHeight = nullptr;
      delete syncEndHeight;
      syncEndHeight = nullptr;
      syncListener = nullptr;
      updateListening();
    }

    virtual void on_new_block(uint64_t height, const cryptonote::block& cnBlock) {

      // notify listeners of block
      MoneroBlock block;
      block.height = height;
      listener->onNewBlock(block);

      // notify listeners of sync progress
      if (syncStartHeight != nullptr && height > *syncStartHeight) {

	// assign end height if necessary
	if (syncEndHeight == nullptr) {
	  syncEndHeight = new uint64_t(wallet->getChainHeight());
	}

	// increase end height if necessary
	if (height > *syncEndHeight) *syncEndHeight = height - *syncStartHeight + 1;

	// prep notification params
	uint64_t numBlocksDone = height - *syncStartHeight;
	uint64_t numBlocksTotal = *syncEndHeight - *syncStartHeight + 1;
	double percentDone = numBlocksDone / (double) numBlocksTotal;
	string message = string("Synchronizing");

	// notify listeners of progress
	if (this->listener != nullptr) this->listener->onSyncProgress(*syncStartHeight, numBlocksDone, numBlocksTotal, percentDone, message);
	if (this->syncListener != nullptr) this->syncListener->onSyncProgress(*syncStartHeight, numBlocksDone, numBlocksTotal, percentDone, message);
      }
    }

  private:
    MoneroWallet* wallet;
    shared_ptr<tools::wallet2> wallet2;
    MoneroWalletListener* listener;
    uint64_t* syncStartHeight;
    uint64_t* syncEndHeight;
    MoneroSyncListener* syncListener;

    void updateListening() {
      wallet2->callback(listener == nullptr && syncListener == nullptr ? nullptr : this);
    }
  };

  // ------------------------------- WALLET METHODS -----------------------------

  bool MoneroWallet::walletExists(const string& path) {
    cout << "walletExists(" << path << ")" << endl;
    bool keyFileExists;
    bool walletFileExists;
    tools::wallet2::wallet_exists(path, keyFileExists, walletFileExists);
    return walletFileExists;
  }

  MoneroWallet::MoneroWallet() {
    cout << "MoneroWallet()" << endl;
    throw runtime_error("Not implemented");
  }

  MoneroWallet::MoneroWallet(const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, const string& language) {
    cout << "MoneroWallet(3)" << endl;
    wallet2 = shared_ptr<tools::wallet2>(new tools::wallet2(static_cast<network_type>(networkType), 1, true));
    MoneroWallet::setDaemonConnection(daemonConnection.uri, daemonConnection.username, daemonConnection.password);
    wallet2->set_seed_language(language);
    crypto::secret_key recovery_val, secret_key;
    wallet2->generate(string(""), string(""), secret_key, false, false);
    wallet2Listener = unique_ptr<Wallet2Listener>(new Wallet2Listener(this, wallet2));
  }

  MoneroWallet::MoneroWallet(const string& mnemonic, const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, uint64_t restoreHeight) {

    // validate mnemonic and get recovery key and language
    crypto::secret_key recoveryKey;
    std::string language;
    bool isValid = crypto::ElectrumWords::words_to_bytes(mnemonic, recoveryKey, language);
    if (!isValid) throw runtime_error("Invalid mnemonic");	// TODO: need proper error handling
    if (language == crypto::ElectrumWords::old_language_name) language = Language::English().get_language_name();

    // initialize wallet
    wallet2 = shared_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(networkType), 1, true));
    wallet2->set_seed_language(language);
    wallet2->generate(string(""), string(""), recoveryKey, true, false);
    wallet2->set_refresh_from_block_height(restoreHeight);
    wallet2Listener = unique_ptr<Wallet2Listener>(new Wallet2Listener(this, wallet2));

    // print the mnemonic
    epee::wipeable_string fetchedMnemonic;
    wallet2->get_seed(fetchedMnemonic);
    cout << "Mnemonic: " << string(fetchedMnemonic.data(), fetchedMnemonic.size()) << endl;
  }

  MoneroWallet::MoneroWallet(const string& address, const string& viewKey, const string& spendKey, const MoneroNetworkType networkType, const string& daemonConnection, uint64_t restoreHeight, const string& language) {
    cout << "MoneroWallet(7)" << endl;
    throw runtime_error("Not implemented");
  }

  MoneroWallet::MoneroWallet(const string& path, const string& password, const MoneroNetworkType networkType) {
    cout << "MoneroWallet(3b)" << endl;
    wallet2 = shared_ptr<tools::wallet2>(new tools::wallet2(static_cast<network_type>(networkType), 1, true));
    wallet2->load(path, password);
  }

  MoneroWallet::~MoneroWallet() {
    cout << "~MoneroWallet()" << endl;
  }


  tools::wallet2* MoneroWallet::getWallet2() {
    return wallet2.get();
  }

  // TODO: switch this to setDaemonConnection(MoneroDaemonRpc& daemonConnection)
  void MoneroWallet::setDaemonConnection(const string& uri, const string& username, const string& password) {
    cout << "setDaemonConnection(" << uri << ", " << username << ", " << password << ")" << endl;

    // prepare uri, login, and isTrusted for wallet2
    boost::optional<epee::net_utils::http::login> login{};
    login.emplace(username, password);
    bool isTrusted = false;
    try { isTrusted = tools::is_local_address(uri); }	// wallet is trusted iff local
    catch (const exception &e) { }

    // set wallet2 daemon connection
    wallet2->set_daemon(uri, login, isTrusted);
  }

  MoneroRpcConnection MoneroWallet::getDaemonConnection() const {
    MoneroRpcConnection connection;
    if (!wallet2->get_daemon_address().empty()) connection.uri = wallet2->get_daemon_address();
    if (wallet2->get_daemon_login()) {
      if (!wallet2->get_daemon_login()->username.empty()) connection.username = wallet2->get_daemon_login()->username;
      epee::wipeable_string wipeablePassword = wallet2->get_daemon_login()->password;
      string password = string(wipeablePassword.data(), wipeablePassword.size());
      if (!password.empty()) connection.password = password;
    }
    return connection;
  }

  string MoneroWallet::getPath() const {
    return wallet2->path();
  }

  MoneroNetworkType MoneroWallet::getNetworkType() const {
    return static_cast<MoneroNetworkType>(wallet2->nettype());
  }

  string MoneroWallet::getLanguage() const {
    return wallet2->get_seed_language();
  }

  string MoneroWallet::getMnemonic() const {
    epee::wipeable_string wipeablePassword;
    wallet2->get_seed(wipeablePassword);
    return string(wipeablePassword.data(), wipeablePassword.size());
  }

  uint64_t MoneroWallet::getHeight() const {
    return wallet2->get_blockchain_current_height();
  }

  uint64_t MoneroWallet::getChainHeight() const {
    string err;
    return wallet2->get_daemon_blockchain_height(err);
  }

  uint64_t MoneroWallet::getRestoreHeight() const {
    return wallet2->get_refresh_from_block_height();
  }

  void MoneroWallet::setListener(MoneroWalletListener* listener) {
    cout << "setListener()" << endl;
    wallet2Listener->setWalletListener(listener);
  }

  MoneroSyncResult MoneroWallet::sync() {
    cout << "sync()" << endl;
    return syncAux(nullptr, nullptr, nullptr);
  }

  MoneroSyncResult MoneroWallet::sync(MoneroSyncListener& listener) {
    cout << "sync(startHeight)" << endl;
    return syncAux(nullptr, nullptr, &listener);
  }

  MoneroSyncResult MoneroWallet::sync(uint64_t startHeight) {
    cout << "sync(startHeight)" << endl;
    return syncAux(&startHeight, nullptr, nullptr);
  }

  MoneroSyncResult MoneroWallet::sync(uint64_t startHeight, MoneroSyncListener& listener) {
    cout << "sync(startHeight, listener)" << endl;
    return syncAux(&startHeight, nullptr, &listener);
  }

  string MoneroWallet::getAddress(uint32_t accountIdx, uint32_t subaddressIdx) const {
    return wallet2->get_subaddress_as_str({accountIdx, subaddressIdx});
  }

  // ------------------------------- PRIVATE HELPERS ----------------------------

  MoneroSyncResult MoneroWallet::syncAux(uint64_t* startHeight, uint64_t* endHeight, MoneroSyncListener* listener) {
    cout << "syncAux()" << endl;

    // validate inputs
    if (endHeight != nullptr) throw runtime_error("Monero core wallet does not support syncing to an end height");	// TODO: custom exception type

    // determine sync start height
    uint64_t syncStartHeight = startHeight == nullptr ? max(MoneroWallet::getHeight(), MoneroWallet::getRestoreHeight()) : *startHeight;

    // sync wallet
    wallet2Listener->onSyncStart(syncStartHeight, listener);
    MoneroSyncResult result;
    wallet2->refresh(wallet2->is_trusted_daemon(), syncStartHeight, result.numBlocksFetched, result.receivedMoney, true);
    wallet2Listener->onSyncEnd();
    return result;





  //  // save start height, end height, and listener for sync notifications
  //  // TODO monero-core: support sync notifications
  //  syncStartHeight = new uint64_t(startHeight == nullptr ? max(MoneroWallet::getHeight(), MoneroWallet::getRestoreHeight()) : *startHeight);
  //  syncEndHeight = new uint64_t(MoneroWallet::getChainHeight());
  //  if (listener != nullptr) syncListener = unique_ptr<MoneroSyncListener>(listener);
  //
  //  // sync wallet
  //  MoneroSyncResult result;
  //  wallet2->refresh(wallet2->is_trusted_daemon(), *syncStartHeight, result.numBlocksFetched, result.receivedMoney, true);
  //
  //  // clear sync state variables
  //  delete syncStartHeight;
  //  syncStartHeight = nullptr;
  //  delete syncEndHeight;
  //  syncEndHeight = nullptr;
  //  syncListener.reset();
  //  return result;

  //    if (startHeight == null) startHeight = Math.max(getHeight(), getRestoreHeight());
  //    if (endHeight != null) throw new MoneroException("Monero core wallet does not support syncing to an end height");
  //
  //    // verify connection to daemon which informs sync end height
  //    MoneroDaemonRpc daemon = new MoneroDaemonRpc(getDaemonConnection());
  //    assertTrue("No connection to daemon", daemon.getIsConnected()); // TODO: way to get end height from wallet2?  need to fallback if daemon not connected, let wallet report sync error
  //
  //    // wrap and register sync listener as normal wallet listener
  //    SyncListenerWrapper syncListenerWrapper = new SyncListenerWrapper(listener);
  //    addListener(syncListenerWrapper);
  //
  //    // register listener which notifies all listeners of sync updates
  //    SyncNotifier syncNotifier = new SyncNotifier(startHeight, getChainHeight() - 1);
  //    addListener(syncNotifier);
  //
  //    // listen for new blocks added to the chain in order to update sync height // TODO: no way to get this from wallet2?
  //    MoneroDaemonListener syncRangeUpdater = new MoneroDaemonListener() {
  //      public void onBlockHeader(MoneroBlockHeader header) {
  //	syncNotifier.setEndHeight(header.getHeight());
  //      }
  //    };
  //    daemon.addListener(syncRangeUpdater);
  //
  //    // sync wallet
  //    syncNotifier.onStart(); // notify sync listeners of 0% progress
  //    Object[] results = syncJni(startHeight);
  //
  //    // unregister listeners
  //    removeListener(syncNotifier);
  //    removeListener(syncListenerWrapper);
  //    daemon.removeListener(syncRangeUpdater);
  //
  //    // return results
  //    return new MoneroSyncResult((long) results[0], (boolean) results[1]);
  }

}
