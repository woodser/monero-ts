#include <stdio.h>
#include <iostream>
#include "wallet2.h"
#include "wallet/monero_wallet_full.h"

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
  monero_wallet* wallet = monero_wallet_full::open_wallet("../../test_wallets/test_wallet_1", "supersecretpassword123", monero_network_type::STAGENET);
  wallet->set_daemon_connection("http://localhost:38081", "", "");

  // fetch txs
  vector<shared_ptr<monero_tx_wallet>> txs = wallet->get_txs();
  MINFO("Wallet has " << txs.size() << " txs.  Printing some.");
  for (int i = 0; i < txs.size() && i < 10; i++) {
    MINFO(txs[i]->serialize());
  }
}
