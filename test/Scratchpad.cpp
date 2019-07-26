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

  // configure logging
  mlog_configure("log_cpp_scratchpad.txt", true);
  mlog_set_log_level(1);
  //MINFO("logging info!!!");
  //MWARNING("logging a warning!!!");
  //MERROR("logging an error!!!");

  // print header
  MINFO("===== Scratchpad =====");
  for (int i = 0; i < argc; i++) {
    MINFO("Argument" << i << ": " << argv[i]);
  }

  string path = "test_wallet_1";
  string password = "supersecretpassword123";
  string language = "English";
  int networkType = 2;

  MINFO("Wallet exists: " << walletExists(path));

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
  MoneroWallet* wallet = MoneroWallet::openWallet("../../test_wallets/test_wallet_1", "supersecretpassword123", MoneroNetworkType::STAGENET);
  wallet->setDaemonConnection("http://localhost:38081", "", "");

  // fetch txs
  vector<shared_ptr<MoneroTxWallet>> txs = wallet->getTxs();
  MINFO("Wallet has " << txs.size() << " txs.  Printing some.");
  for (int i = 0; i < txs.size() && i < 10; i++) {
    MINFO(txs[i]->serialize());
  }

//  shared_ptr<MoneroTransferRequest> transferRequest = shared_ptr<MoneroTransferRequest>(new MoneroTransferRequest());
//  transferRequest->accountIndex = 0;
//  shared_ptr<MoneroTxRequest> txRequest = shared_ptr<MoneroTxRequest>(new MoneroTxRequest());
//  txRequest->isConfirmed = true;
//  transferRequest->txRequest = txRequest;
//  //txRequest->transferRequest = transferRequest;
//  vector<shared_ptr<MoneroTransfer>> transfers = wallet->getTransfers(*transferRequest);
//  if (transfers.empty()) throw runtime_error("Transfers should not be empty");
//  for (const shared_ptr<MoneroTransfer>& transfer : transfers) {
//    if (*transfer->accountIndex != 0) throw runtime_error("Account should be 0");
//    if (!*transfer->tx->isConfirmed) throw runtime_error("Transfer should be confirmed");
//  }

//  shared_ptr<MoneroTxRequest> txRequest = shared_ptr<MoneroTxRequest>(new MoneroTxRequest());
//  txRequest->isConfirmed = true;
//  vector<shared_ptr<MoneroTxWallet>> txs = wallet->getTxs(*txRequest);
//  if (txs.empty()) throw runtime_error("Txs should not be empty");
//  for (const shared_ptr<MoneroTxWallet>& tx : txs) {
//    if (!*tx->isConfirmed) throw runtime_error("Tx should be confirmed");
//  }


//  // debug simple block merging
//  vector<shared_ptr<MoneroTxWallet>> txs = wallet->getTxs();
//  if (txs.empty()) throw runtime_error("Txs should not be empty");
//  shared_ptr<MoneroBlock> block = nullptr;
//  for (const shared_ptr<MoneroTxWallet>& tx : txs) {
//    if (tx->getHeight().get() != 360559l) throw runtime_error("Anything other than 360559l should be filtered");
//    cout << "We have one!!!" << endl;
//    if (block == nullptr) block = tx->block.get();
//    else {
//      if (block != tx->block.get()) {
//        cout << "BOOM" << endl;
//        cout << block->serialize();
//        cout << "--- VS ---" << endl;
//        cout << tx->block.get()->serialize();
//      }
//    }
//  }
}
