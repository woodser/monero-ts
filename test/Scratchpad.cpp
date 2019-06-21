#include <stdio.h>
#include <iostream>
#include "wallet2.h"
#include "wallet/MoneroWallet.h"
//#include <boost/stacktrace.hpp>
using namespace std;

bool walletExists(string path) {
  //std::cout << boost::stacktrace::stacktrace();
  bool keys_file_exists;
  bool wallet_file_exists;
  tools::wallet2::wallet_exists(path, keys_file_exists, wallet_file_exists);
  return wallet_file_exists;
}

void openWallet(string path, string password, int networkType) {
  cout << "openWallet(" << path << ", " << password << ", " << networkType << ")" << endl;
  std::unique_ptr<tools::wallet2> wallet;
  wallet.reset(new tools::wallet2(cryptonote::network_type::STAGENET, 1, true));
  throw runtime_error("Not implemented");
}

void createWalletRandom(string language, int networkType) {
  tools::wallet2* wallet = new tools::wallet2(static_cast<cryptonote::network_type>(networkType), 1, true);
  wallet->set_seed_language(language);
  crypto::secret_key recovery_val, secret_key;
  wallet->generate(string(""), string(""), secret_key, false, false);

  // print the mnemonic
  epee::wipeable_string mnemonic;
  wallet->get_seed(mnemonic);
  cout << "Mnemonic: " << string(mnemonic.data(), mnemonic.size()) << endl;
}

/**
 * Scratchpad main entry point.
 */
int main(int argc, const char* argv[]) {

  // print header
  cout << "===== Scratchpad =====" << endl;
  for (int i = 0; i < argc; i++) {
    printf("Argument %d: %s\n", i, argv[i]);
  }
  cout << endl;

  string path = "test_wallet_1";
  string password = "supersecretpassword123";
  string language = "English";
  int networkType = 2;

  cout << "Wallet exists: " << walletExists(path) << endl;

//  openWallet(path, password, networkType);
//  createWalletRandom(language, networkType);

//  // create wallet
//  MoneroWallet* wallet = new MoneroWallet();
//
//  // get the mnemonic
//  epee::wipeable_string mnemonic;
//  wallet->getMnemonic(mnemonic);
//  cout << "Mnemonic: " << string(mnemonic.data(), mnemonic.size()) << endl;


  // load wallet
  MoneroWallet* wallet = new MoneroWallet("../../test_wallets/test_wallet_1", "supersecretpassword123", MoneroNetworkType::STAGENET);
  //MoneroRpcConnection daemonConnection = MoneroRpcConnection("http://localhost:38083", "", "");
  wallet->setDaemonConnection("http://localhost:38081", "", "");

  shared_ptr<MoneroTransferRequest> transferRequest = shared_ptr<MoneroTransferRequest>(new MoneroTransferRequest());
  transferRequest->accountIndex = 0;
  shared_ptr<MoneroTxRequest> txRequest = shared_ptr<MoneroTxRequest>(new MoneroTxRequest());
  txRequest->isConfirmed = true;
  transferRequest->txRequest = txRequest;
  //txRequest->transferRequest = transferRequest;
  vector<shared_ptr<MoneroTransfer>> transfers = wallet->getTransfers(*transferRequest);
  if (transfers.empty()) throw runtime_error("Transfers should not be empty");
  for (const shared_ptr<MoneroTransfer>& transfer : transfers) {
    if (*transfer->accountIndex != 0) throw runtime_error("Account should be 0");
    if (!*transfer->tx->isConfirmed) throw runtime_error("Transfer should be confirmed");
  }
}
