#include "MoneroWallet.h"

#include <stdio.h>
#include <iostream>
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"

using namespace cryptonote;

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
  wallet2 = new tools::wallet2(static_cast<network_type>(networkType), 1, true);
  MoneroWallet::setDaemonConnection(daemonConnection.uri, daemonConnection.username, daemonConnection.password);
  wallet2->set_seed_language(language);
  crypto::secret_key recovery_val, secret_key;
  wallet2->generate(string(""), string(""), secret_key, false, false);
}

MoneroWallet::MoneroWallet(const string& mnemonic, const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, uint64_t restoreHeight) {

  // validate mnemonic and get recovery key and language
  crypto::secret_key recoveryKey;
  std::string language;
  bool isValid = crypto::ElectrumWords::words_to_bytes(mnemonic, recoveryKey, language);
  if (!isValid) throw runtime_error("Invalid mnemonic");	// TODO: need proper error handling
  if (language == crypto::ElectrumWords::old_language_name) language = Language::English().get_language_name();

  // initialize wallet
  wallet2 = new tools::wallet2(static_cast<cryptonote::network_type>(networkType), 1, true);
  wallet2->set_seed_language(language);
  wallet2->generate(string(""), string(""), recoveryKey, true, false);
  wallet2->set_refresh_from_block_height(restoreHeight);

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
  wallet2 = new tools::wallet2(static_cast<network_type>(networkType), 1, true);
  wallet2->load(path, password);
}

MoneroWallet::~MoneroWallet() {
  cout << "~MoneroWallet()" << endl;
}


tools::wallet2* MoneroWallet::getWallet2() {
  return wallet2;
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

MoneroSyncResult MoneroWallet::sync() {
  cout << "sync()" << endl;
  throw runtime_error("Not implemented");
  //  tools::wallet2* wallet = getHandle<tools::wallet2>(env, instance, "walletHandle");
  //  uint64_t blocksFetched;
  //  bool receivedMoney;
  //  wallet->refresh(wallet->is_trusted_daemon(), startHeight, blocksFetched, receivedMoney, true);
  //  cout << "Done refreshing.  Blocks fetched: " << blocksFetched << ", received money: " << receivedMoney << endl;
}

MoneroSyncResult MoneroWallet::sync(MoneroSyncListener& listener) {
  cout << "sync(listener)" << endl;
  throw runtime_error("Not implemented");
}

MoneroSyncResult MoneroWallet::sync(uint64_t startHeight) {
  cout << "sync(startHeight)" << endl;
  throw runtime_error("Not implemented");
}

MoneroSyncResult MoneroWallet::sync(uint64_t startHeight, MoneroSyncListener& listener) {
  cout << "sync(startHeight, listener)" << endl;
  throw runtime_error("Not implemented");
}

string MoneroWallet::getAddress(uint32_t accountIdx, uint32_t subaddressIdx) const {
  return wallet2->get_subaddress_as_str({accountIdx, subaddressIdx});
}
