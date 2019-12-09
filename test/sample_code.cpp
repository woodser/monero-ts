#include <stdio.h>
#include <iostream>
#include "wallet2.h"
#include "wallet/monero_wallet.h"

using namespace std;

bool OUTPUT_RECEIVED = false;

/**
 * This code introduces the API.
 *
 * NOTE: depending on feedback, fields might change to become private and accessible only
 * through public acessors/mutators for pure object-oriented, etc.
 */
int main(int argc, const char* argv[]) {

//  // configure logging
//  mlog_configure("log_cpp_sample_code.txt", true);
//  mlog_set_log_level(1);

  // create a wallet from a mnemonic phrase
  string mnemonic = "hefty value later extra artistic firm radar yodel talent future fungal nutshell because sanity awesome nail unjustly rage unafraid cedar delayed thumbs comb custom sanity";
  monero_wallet* wallet_restored = monero_wallet::create_wallet_from_mnemonic(
      "MyWalletRestored",                               // wallet path and name
      "supersecretpassword123",                         // wallet password
      monero_network_type::STAGENET,                    // network type
      mnemonic,                                         // mnemonic phrase
      monero_rpc_connection("http://localhost:38081"),  // daemon connection
      380104                                            // restore height
  );

  // synchronize the wallet and receive progress notifications
  struct : monero_sync_listener {
    void on_sync_progress(uint64_t height, uint64_t start_height, uint64_t end_height, double percent_done, const string& message) {
      // feed a progress bar?
    }
  } my_sync_listener;
  wallet_restored->sync(my_sync_listener);

  // start syncing the wallet continuously in the background
  wallet_restored->start_syncing();

  // get balance, account, subaddresses
  string restored_primary = wallet_restored->get_primary_address();
  uint64_t balance = wallet_restored->get_balance();    // can specify account and subaddress indices
  monero_account account = wallet_restored->get_account(1, true);       // get account with subaddresses
  uint64_t unlocked_account_balance = account.m_unlocked_balance.get(); // get boost::optional value

  // query a transaction by hash
  monero_tx_query tx_query;
  tx_query.m_hash = "314a0f1375db31cea4dac4e0a51514a6282b43792269b3660166d4d2b46437ca";
  shared_ptr<monero_tx_wallet> tx = wallet_restored->get_txs(tx_query)[0];
  for (const shared_ptr<monero_incoming_transfer> in_transfer : tx->m_incoming_transfers) {
    uint64_t in_amount = in_transfer->m_amount.get();
    int account_index = in_transfer->m_account_index.get();
  }

  // query incoming transfers to account 1
  monero_transfer_query transfer_query;
  transfer_query.m_is_incoming = true;
  transfer_query.m_account_index = 1;
  vector<shared_ptr<monero_transfer>> transfers = wallet_restored->get_transfers(transfer_query);

  // query unspent outputs
  monero_output_query output_query;
  output_query.m_is_spent = false;
  vector<shared_ptr<monero_output_wallet>> outputs = wallet_restored->get_outputs(output_query);

  // create and sync a new wallet with a random mnemonic phrase
  monero_wallet* wallet_random = monero_wallet::create_wallet_random(
      "MyWalletRandom",                                 // wallet path and name
      "supersecretpassword123",                         // wallet password
      monero_network_type::STAGENET,                    // network type
      monero_rpc_connection("http://localhost:38081"),  // daemon connection
      "English"
  );
  wallet_random->sync();

  // continuously synchronize the wallet in the background
  wallet_random->start_syncing();

  // get wallet info
  string random_mnemonic = wallet_random->get_mnemonic();
  string random_primary = wallet_random->get_primary_address();
  uint64_t random_height = wallet_random->get_height();
  bool random_is_synced = wallet_random->is_synced();

  // be notified when the wallet receives funds
  struct : monero_wallet_listener {
    void on_output_received(const monero_output_wallet& output) {
      cout << "Wallet received funds!" << endl;
      string tx_hash = output.m_tx->m_hash.get();
      int account_index = output.m_account_index.get();
      int subaddress_index = output.m_subaddress_index.get();
      OUTPUT_RECEIVED = true;
    }
  } my_listener;
  wallet_random->add_listener(my_listener);

  // send funds from the restored wallet to the random wallet
  shared_ptr<monero_tx_wallet> sent_tx = wallet_restored->send(0, wallet_random->get_address(1, 0), 50000).m_txs[0];
  bool in_pool = sent_tx->m_in_tx_pool.get();  // true

  // mine with 7 threads to push the network along
  int num_threads = 7;
  bool is_background = false;
  bool ignore_battery = false;
  wallet_restored->start_mining(num_threads, is_background, ignore_battery);

  // wait for the next block to be added to the chain
  uint64_t next_height = wallet_random->wait_for_next_block();

  // stop mining
  wallet_restored->stop_mining();

  // create a request to send funds to multiple destinations in the random wallet
  monero_send_request send_request = monero_send_request();
  send_request.m_account_index = 1;                // withdraw funds from this account
  send_request.m_subaddress_indices = vector<uint32_t>();
  send_request.m_subaddress_indices.push_back(0);
  send_request.m_subaddress_indices.push_back(1);  // withdraw funds from these subaddresses within the account
  send_request.m_priority = monero_send_priority::UNIMPORTANT;  // no rush
  vector<shared_ptr<monero_destination>> destinations;  // specify the recipients and their amounts
  destinations.push_back(make_shared<monero_destination>(wallet_random->get_address(1, 0), 50000));
  destinations.push_back(make_shared<monero_destination>(wallet_random->get_address(2, 0), 50000));
  send_request.m_destinations = destinations;

  // create the transaction, confirm with the user, and relay to the network
  shared_ptr<monero_tx_wallet> created_tx = wallet_restored->create_tx(send_request).m_txs[0];
  uint64_t fee = created_tx->m_fee.get(); // "Are you sure you want to send ...?"
  wallet_restored->relay_tx(*created_tx); // submit the transaction to the Monero network which will notify the recipient wallet

  // the recipient wallet will be notified
  if (OUTPUT_RECEIVED) cout << "Sample code completed successfully" << endl;
  else throw runtime_error("Output should have been received");
}
