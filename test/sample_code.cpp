#include <stdio.h>
#include <iostream>
#include "wallet2.h"
#include "wallet/monero_wallet_full.h"

using namespace std;

bool FUNDS_RECEIVED = false;

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
  monero_wallet* wallet_restored = monero_wallet_full::create_wallet_from_mnemonic(
      "MyWalletRestored",                   // wallet path and name
      "supersecretpassword123",             // wallet password
      monero_network_type::STAGENET,        // network type
      mnemonic,                             // mnemonic phrase
      monero_rpc_connection(                // daemon connection
          string("http://localhost:38081"),
          string("superuser"),
          string("abctesting123")),
      380104,                               // restore height
      ""                                    // seed offset
  );

  // synchronize the wallet and receive progress notifications
  struct : monero_wallet_listener {
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
  for (const shared_ptr<monero_transfer> transfer : tx->get_transfers()) {
    bool is_incoming = transfer->is_incoming().get();
    uint64_t in_amount = transfer->m_amount.get();
    int account_index = transfer->m_account_index.get();
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
  monero_wallet* wallet_random = monero_wallet_full::create_wallet_random(
      "MyWalletRandom",                     // wallet path and name
      "supersecretpassword123",             // wallet password
      monero_network_type::STAGENET,        // network type
      monero_rpc_connection(                // daemon connection
          string("http://localhost:38081"),
          string("superuser"),
          string("abctesting123")),
      "English");
  wallet_random->sync();

  // synchronize in the background every 5 seconds
  wallet_random->start_syncing(5000);

  // get wallet info
  string random_mnemonic = wallet_random->get_mnemonic();
  string random_primary = wallet_random->get_primary_address();
  uint64_t random_height = wallet_random->get_height();
  bool random_is_synced = wallet_random->is_synced();

  // receive notifications when the wallet receives funds
  struct : monero_wallet_listener {
    void on_output_received(const monero_output_wallet& output) {
      cout << "Wallet received funds!" << endl;
      uint64_t amount = output.m_amount.get();
      string tx_hash = output.m_tx->m_hash.get();
      bool is_confirmed = output.m_tx->m_is_confirmed.get();
      bool is_locked = static_pointer_cast<monero_tx_wallet>(output.m_tx)->m_is_locked.get();
      int account_index = output.m_account_index.get();
      int subaddress_index = output.m_subaddress_index.get();
      FUNDS_RECEIVED = true;
    }
  } my_listener;
  wallet_random->add_listener(my_listener);

  // send funds from the restored wallet to the random wallet
  monero_tx_config config;
  config.m_account_index = 0;
  config.m_address = wallet_random->get_address(1, 0);
  config.m_amount = 50000;
  config.m_relay = true;
  shared_ptr<monero_tx_wallet> sent_tx = wallet_restored->create_tx(config);
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

  // create config to send funds to multiple destinations in the random wallet
  config = monero_tx_config();
  config.m_account_index = 1;                // withdraw funds from this account
  config.m_subaddress_indices = vector<uint32_t>();
  config.m_subaddress_indices.push_back(0);
  config.m_subaddress_indices.push_back(1);  // withdraw funds from these subaddresses within the account
  config.m_priority = monero_tx_priority::UNIMPORTANT;  // no rush
  config.m_relay = false;  // create transaction and relay to the network if true
  vector<shared_ptr<monero_destination>> destinations;  // specify the recipients and their amounts
  destinations.push_back(make_shared<monero_destination>(wallet_random->get_address(1, 0), 50000));
  destinations.push_back(make_shared<monero_destination>(wallet_random->get_address(2, 0), 50000));
  config.m_destinations = destinations;

  // create the transaction, confirm with the user, and relay to the network
  shared_ptr<monero_tx_wallet> created_tx = wallet_restored->create_tx(config);
  uint64_t fee = created_tx->m_fee.get(); // "Are you sure you want to send ...?"
  wallet_restored->relay_tx(*created_tx); // recipient receives notification within 5 seconds

  // the recipient wallet will be notified
  if (FUNDS_RECEIVED) cout << "Sample code completed successfully" << endl;
  else throw runtime_error("Output should have been received");

  // save and close the wallets
  wallet_restored->close(true);
  wallet_random->close(true);
}
