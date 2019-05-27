#include <stdio.h>
#include <iostream>
#include "MoneroWallet.h"

using namespace std;
using namespace epee;

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

MoneroWallet::MoneroWallet(network_type networkType, const string& daemonConnection, const string& language) {
  wallet2 = new tools::wallet2(networkType, 1, true);
  MoneroWallet::setDaemonConnection(daemonConnection, nullptr, nullptr);
  wallet2->set_seed_language(language);
  crypto::secret_key recovery_val, secret_key;
  wallet2->generate(string(""), string(""), secret_key, false, false);
  cout << "MoneroWallet(3)" << endl;
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

void MoneroWallet::setDaemonConnection(const string& daemonUri, const string& daemonUsername, const epee::wipeable_string& daemonPassword) {
  throw runtime_error("Not implemented");
}
