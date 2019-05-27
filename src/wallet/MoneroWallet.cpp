#include <stdio.h>
#include <iostream>
#include "MoneroWallet.h"

bool MoneroWallet::walletExists(const string& path) {
  cout << "walletExists(" << path << ")" << endl;
  bool keyFileExists;
  bool walletFileExists;
  tools::wallet2::wallet_exists(path, keyFileExists, walletFileExists);
  return walletFileExists;
}

MoneroWallet::MoneroWallet() {
  cout << "MoneroWallet()" << endl;
}

MoneroWallet::MoneroWallet(network_type networkType, const MoneroRpcConnection& daemonConnection, const string& language) {
  wallet2 = new tools::wallet2(networkType, 1, true);
  MoneroWallet::setDaemonConnection(daemonConnection.uri, daemonConnection.username, daemonConnection.password);
  wallet2->set_seed_language(language);
  crypto::secret_key recovery_val, secret_key;
  wallet2->generate(string(""), string(""), secret_key, false, false);
}

MoneroWallet::MoneroWallet(const string& mnemonic, network_type networkType, const string& daemonConnection, uint64_t restoreHeight) {
  cout << "MoneroWallet(4)" << endl;
}

MoneroWallet::MoneroWallet(const string& address, const string& viewKey, const string& spendKey, network_type networkType, const string& daemonConnection, uint64_t restoreHeight, const string& language) {
  cout << "MoneroWallet(7)" << endl;
}

MoneroWallet::MoneroWallet(const string& path, const epee::wipeable_string& password, network_type networkType) {
  wallet2 = new tools::wallet2(networkType, 1, true);
  wallet2->load(path, password);
}

MoneroWallet::~MoneroWallet() {
  cout << "~MoneroWallet()" << endl;
}

void MoneroWallet::getMnemonic(epee::wipeable_string& mnemonic) const {
  throw runtime_error("Not implemented");
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
