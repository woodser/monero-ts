#include "MoneroWallet.h"

#include <stdio.h>
#include <iostream>

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
  wallet2 = new tools::wallet2(static_cast<network_type>(networkType), 1, true);
  MoneroWallet::setDaemonConnection(daemonConnection.uri, daemonConnection.username, daemonConnection.password);
  wallet2->set_seed_language(language);
  crypto::secret_key recovery_val, secret_key;
  wallet2->generate(string(""), string(""), secret_key, false, false);
}

MoneroWallet::MoneroWallet(const string& mnemonic, const MoneroNetworkType networkType, const string& daemonConnection, uint64_t restoreHeight) {
  cout << "MoneroWallet(4)" << endl;
  throw runtime_error("Not implemented");
}

MoneroWallet::MoneroWallet(const string& address, const string& viewKey, const string& spendKey, const MoneroNetworkType networkType, const string& daemonConnection, uint64_t restoreHeight, const string& language) {
  cout << "MoneroWallet(7)" << endl;
  throw runtime_error("Not implemented");
}

MoneroWallet::MoneroWallet(const string& path, const epee::wipeable_string& password, const MoneroNetworkType networkType) {
  wallet2 = new tools::wallet2(static_cast<network_type>(networkType), 1, true);
  wallet2->load(path, password);
}

MoneroWallet::~MoneroWallet() {
  cout << "~MoneroWallet()" << endl;
}

void MoneroWallet::setDaemonConnection(const string& uri, const string& username, const epee::wipeable_string& password) {

  // prepare uri, login, and isTrusted for wallet2
  boost::optional<epee::net_utils::http::login> login{};
  login.emplace(username, password);
  bool isTrusted = false;
  try { isTrusted = tools::is_local_address(uri); }	// wallet is trusted iff local
  catch (const exception &e) { }

  // set wallet2 daemon connection
  wallet2->set_daemon(uri, login, isTrusted);
}

MoneroNetworkType MoneroWallet::getNetworkType() {
  return static_cast<MoneroNetworkType>(wallet2->nettype());
}

void MoneroWallet::getMnemonic(epee::wipeable_string& mnemonic) const {
  wallet2->get_seed(mnemonic);
}

string MoneroWallet::getAddress(uint32_t accountIdx, uint32_t subaddressIdx) {
  return wallet2->get_subaddress_as_str({accountIdx, subaddressIdx});
}
