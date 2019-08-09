#include <stdio.h>
#include <iostream>
#include "wallet2.h"
#include "wallet/monero_wallet.h"

using namespace std;

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
  int network_type = 2;

  // load wallet
  monero_wallet* wallet = monero_wallet::open_wallet("../../test_wallets/test_wallet_1", "supersecretpassword123", monero_network_type::STAGENET);
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
}
