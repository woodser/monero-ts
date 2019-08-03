#include <stdio.h>
#include <iostream>
#include "wallet2.h"
#include "wallet/monero_wallet.h"
//#include <boost/stacktrace.hpp>
using namespace std;

bool walletExists(string path) {
  //std::cout << boost::stacktrace::stacktrace();
  bool keys_file_exists;
  bool wallet_file_exists;
  tools::wallet2::wallet_exists(path, keys_file_exists, wallet_file_exists);
  return wallet_file_exists;
}

void open_wallet(string path, string password, int networkType) {
  cout << "open_wallet(" << path << ", " << password << ", " << networkType << ")" << endl;
  std::unique_ptr<tools::wallet2> wallet;
  wallet.reset(new tools::wallet2(cryptonote::network_type::STAGENET, 1, true));
  throw runtime_error("Not implemented");
}

void create_wallet_random(string language, int networkType) {
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

//  open_wallet(path, password, networkType);
//  create_wallet_random(language, networkType);

//  // create wallet
//  monero_wallet* wallet = new monero_wallet();
//
//  // get the mnemonic
//  epee::wipeable_string mnemonic;
//  wallet->get_mnemonic(mnemonic);
//  cout << "Mnemonic: " << string(mnemonic.data(), mnemonic.size()) << endl;


  // load wallet
  monero_wallet* wallet = monero_wallet::open_wallet("../../test_wallets/test_wallet_1", "supersecretpassword123", MoneroNetworkType::STAGENET);
  wallet->set_daemon_connection("http://localhost:38081", "", "");

  // fetch txs
  vector<shared_ptr<monero_tx_wallet>> txs = wallet->get_txs();
  MINFO("Wallet has " << txs.size() << " txs.  Printing some.");
  for (int i = 0; i < txs.size() && i < 10; i++) {
    MINFO(txs[i]->serialize());
  }

//  shared_ptr<monero_transfer_request> transfer_request = shared_ptr<monero_transfer_request>(new monero_transfer_request());
//  transfer_request->account_index = 0;
//  shared_ptr<monero_tx_request> tx_request = shared_ptr<monero_tx_request>(new monero_tx_request());
//  tx_request->is_confirmed = true;
//  transfer_request->tx_request = tx_request;
//  //tx_request->transfer_request = transfer_request;
//  vector<shared_ptr<monero_transfer>> transfers = wallet->get_transfers(*transfer_request);
//  if (transfers.empty()) throw runtime_error("Transfers should not be empty");
//  for (const shared_ptr<monero_transfer>& transfer : transfers) {
//    if (*transfer->account_index != 0) throw runtime_error("Account should be 0");
//    if (!*transfer->tx->is_confirmed) throw runtime_error("Transfer should be confirmed");
//  }

//  shared_ptr<monero_tx_request> tx_request = shared_ptr<monero_tx_request>(new monero_tx_request());
//  tx_request->is_confirmed = true;
//  vector<shared_ptr<monero_tx_wallet>> txs = wallet->get_txs(*tx_request);
//  if (txs.empty()) throw runtime_error("Txs should not be empty");
//  for (const shared_ptr<monero_tx_wallet>& tx : txs) {
//    if (!*tx->is_confirmed) throw runtime_error("Tx should be confirmed");
//  }


//  // debug simple block merging
//  vector<shared_ptr<monero_tx_wallet>> txs = wallet->get_txs();
//  if (txs.empty()) throw runtime_error("Txs should not be empty");
//  shared_ptr<monero_block> block = nullptr;
//  for (const shared_ptr<monero_tx_wallet>& tx : txs) {
//    if (tx->get_height().get() != 360559l) throw runtime_error("Anything other than 360559l should be filtered");
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
