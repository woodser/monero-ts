/**
 * Provides a bridge from WebAssembly to the Monero wallet.
 */
#ifndef monero_wallet_wasm_bridge_h
#define monero_wallet_wasm_bridge_h

#include <emscripten/bind.h>
#include <string>

using namespace std;
using namespace emscripten;

namespace monero_wallet_wasm_bridge
{
  int create_wallet_dummy();
  void dummy_method(int handle);

  // TODO: remove path from these, they're not used
  void open_wallet(const string& path, const string& password, int network_type, const string& keys_data, const string& cache_data, const string& daemon_uri, const string& daemon_username, const string& daemon_password, emscripten::val callback);
  void create_wallet_random(const string& path, const string& password, int network_type, const string& daemon_uri, const string& daemon_username, const string& daemon_password, const string& language, emscripten::val callback);
  void create_wallet_from_mnemonic(const string& path, const string& password, int network_type, const string& mnemonic, const string& daemon_uri, const string& daemon_username, const string& daemon_password, long restore_height, emscripten::val callback);

//  void set_daemon_connection(int handle, const string& uri, const string& username = "", const string& password = "");
//  string get_daemon_connection(int handle);
//  bool is_connected(int handle);
//  bool is_daemon_synced(int handle);
//  bool is_daemon_trusted(int handle);
//  bool is_synced(int handle);
//  int get_network_type(int handle);
  string get_seed(int handle);
  string get_mnemonic(int handle);
  string get_language(int handle);
  string get_languages(int handle);
  string get_public_view_key(int handle);
  string get_private_view_key(int handle);
  string get_public_spend_key(int handle);
  string get_private_spend_key(int handle);
  string get_address(int handle, const uint32_t account_idx, const uint32_t subaddress_idx);
  string get_address_index(int handle, const string& address);
  string get_integrated_address(int handle, const string& standard_address = "", const string& payment_id = "");
  string decode_integrated_address(int handle, const string& integrated_address);
  void get_height(int handle, emscripten::val callback);
//  long get_restore_height(int handle);
//  void set_restore_height(int handle, long restore_height);
//  long get_daemon_height(int handle);
//  long get_daemon_max_peer_height(int handle);
  //void add_listener(int handle, monero_wallet_listener& listener);
  //void remove_listener(int handle, monero_wallet_listener& listener);
  //set<monero_wallet_listener*> get_listeners(int handle);
  void sync(int handle, emscripten::val callback);
  //  emscripten::function("start_syncing", &monero_wallet_wasm_bridge::start_syncing);
  //  emscripten::function("rescan_spent", &monero_wallet_wasm_bridge::rescan_spent);
  //  emscripten::function("rescan_blockchain", &monero_wallet_wasm_bridge::rescan_blockchain);
  string get_balance_wallet(int handle);
  string get_balance_account(int handle, const uint32_t account_idx);
  string get_balance_subaddress(int handle, const uint32_t account_idx, const uint32_t subaddress_idx);
  string get_unlocked_balance_wallet(int handle);
  string get_unlocked_balance_account(int handle, const uint32_t account_idx);
  string get_unlocked_balance_subaddress(int handle, const uint32_t account_idx, const uint32_t subaddress_idx);
  string get_accounts(int handle, bool include_subaddresses = false, const string& tag = "");
  string get_account(int handle, uint32_t account_idx, bool include_subaddresses = false);
  //  emscripten::function("create_account", &monero_wallet_wasm_bridge::create_account);
  string get_subaddresses(int handle, const string& args);
  //  emscripten::function("create_subaddress", &monero_wallet_wasm_bridge::create_subaddress);
  void get_txs(int handle, const string& tx_query_str, emscripten::val callback);
  //  emscripten::function("get_txs", &monero_wallet_wasm_bridge::get_txs);
  //  emscripten::function("get_transfers", &monero_wallet_wasm_bridge::get_transfers);
  //  emscripten::function("get_incoming_transfers", &monero_wallet_wasm_bridge::TODO);
  //  emscripten::function("get_outgoing_transfers", &monero_wallet_wasm_bridge::TODO);
  //  emscripten::function("get_outputs", &monero_wallet_wasm_bridge::get_outputs);
  //  emscripten::function("get_outputs_hex", &monero_wallet_wasm_bridge::get_outputs_hex);
  //  emscripten::function("import_outputs_hex", &monero_wallet_wasm_bridge::import_outputs_hex);
  //  emscripten::function("get_key_images", &monero_wallet_wasm_bridge::get_key_images);
  //  emscripten::function("import_key_images", &monero_wallet_wasm_bridge::import_key_images);
  //  emscripten::function("get_new_key_images_from_last_import", &monero_wallet_wasm_bridge::get_new_key_images_from_last_import);
  //  emscripten::function("relay_txs", &monero_wallet_wasm_bridge::relay_txs);

  void send_split(int handle, const string& send_request_json, emscripten::val callback);

  //  emscripten::function("send_split", &monero_wallet_wasm_bridge::send_split);
  //  emscripten::function("sweep_output", &monero_wallet_wasm_bridge::sweep_output);
  //  emscripten::function("sweep_unlocked", &monero_wallet_wasm_bridge::sweep_unlocked);
  //  emscripten::function("sweep_dust", &monero_wallet_wasm_bridge::sweep_dust);
  //  emscripten::function("sign", &monero_wallet_wasm_bridge::sign);
  //  emscripten::function("verify", &monero_wallet_wasm_bridge::verify);
  //  emscripten::function("get_tx_key", &monero_wallet_wasm_bridge::get_tx_key);
  //  emscripten::function("check_tx_key", &monero_wallet_wasm_bridge::check_tx_key);
  //  emscripten::function("get_tx_proof", &monero_wallet_wasm_bridge::get_tx_proof);
  //  emscripten::function("check_tx_proof", &monero_wallet_wasm_bridge::check_tx_proof);
  //  emscripten::function("get_spend_proof", &monero_wallet_wasm_bridge::get_spend_proof);
  //  emscripten::function("check_spend_proof", &monero_wallet_wasm_bridge::check_spend_proof);
  //  emscripten::function("get_reserve_proof_wallet", &monero_wallet_wasm_bridge::get_reserve_proof_wallet);
  //  emscripten::function("get_reserve_proof_account", &monero_wallet_wasm_bridge::get_reserve_proof_account);
  //  emscripten::function("check_reserve_proof", &monero_wallet_wasm_bridge::check_reserve_proof);
  //  emscripten::function("get_tx_notes", &monero_wallet_wasm_bridge::get_tx_notes);
  //  emscripten::function("set_tx_notes", &monero_wallet_wasm_bridge::set_tx_notes);
  //  emscripten::function("get_address_book_entries", &monero_wallet_wasm_bridge::get_address_book_entries);
  //  emscripten::function("add_address_book_entry", &monero_wallet_wasm_bridge::add_address_book_entry);
  //  emscripten::function("delete_address_book_entry", &monero_wallet_wasm_bridge::delete_address_book_entry);
  //  emscripten::function("tag_accounts", &monero_wallet_wasm_bridge::tag_accounts);
  //  emscripten::function("untag_accounts", &monero_wallet_wasm_bridge::untag_accounts);
  //  emscripten::function("get_account_tags", &monero_wallet_wasm_bridge::get_account_tags);
  //  emscripten::function("set_account_tag_label", &monero_wallet_wasm_bridge::set_account_tag_label);
  //  emscripten::function("create_payment_uri", &monero_wallet_wasm_bridge::create_payment_uri);
  //  emscripten::function("parse_payment_uri", &monero_wallet_wasm_bridge::parse_payment_uri);
  string get_attribute(int handle, const string& key);
  void set_attribute(int handle, const string& key, const string& val);
  //  emscripten::function("start_mining", &monero_wallet_wasm_bridge::start_mining);
  //  emscripten::function("stop_mining", &monero_wallet_wasm_bridge::stop_mining);
  //  emscripten::function("is_multisig_import_needed", &monero_wallet_wasm_bridge::is_multisig_import_needed);
  //  emscripten::function("is_multisig", &monero_wallet_wasm_bridge::is_multisig);
  //  emscripten::function("get_multisig_info", &monero_wallet_wasm_bridge::get_multisig_info);
  //  emscripten::function("prepare_multisig", &monero_wallet_wasm_bridge::prepare_multisig);
  //  emscripten::function("make_multisig", &monero_wallet_wasm_bridge::make_multisig);
  //  emscripten::function("exchange_multisig_keys", &monero_wallet_wasm_bridge::exchange_multisig_keys);
  //  emscripten::function("get_multisig_hex", &monero_wallet_wasm_bridge::get_multisig_hex);
  //  emscripten::function("import_multisig_hex", &monero_wallet_wasm_bridge::import_multisig_hex);
  //  emscripten::function("sign_multisig_tx_hex", &monero_wallet_wasm_bridge::sign_multisig_tx_hex);
  //  emscripten::function("submit_multisig_tx_hex", &monero_wallet_wasm_bridge::submit_multisig_tx_hex);
  //  emscripten::function("save", &monero_wallet_wasm_bridge::save);
  void close(int handle);
  string get_address_file_buffer(int handle);
  string get_keys_file_buffer(int handle, string password, bool watch_only);
  string get_cache_file_buffer(int handle, string password);
}

#endif /* monero_wallet_wasm_bridge_h */
