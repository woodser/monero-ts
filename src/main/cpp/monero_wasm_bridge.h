/**
 * Provides a bridge from WebAssembly to the Monero wallet.
 */
#ifndef monero_wasm_bridge_h
#define monero_wasm_bridge_h

#include <emscripten/bind.h>
#include <string>

using namespace std;
using namespace emscripten;

namespace monero_wasm_bridge
{

  // ------------------------------ UTILITIES ---------------------------------

  string malloc_binary_from_json(const string &args_string);
  string binary_to_json(const string &args_string);
  string binary_blocks_to_json(const string &args_string);

  // ------------------------- STATIC WALLET UTILS ----------------------------

  void open_core_wallet(const string& password, int network_type, const string& keys_data, const string& cache_data, const string& daemon_uri, const string& daemon_username, const string& daemon_password, emscripten::val callback);
  void create_core_wallet_random(const string& password, int network_type, const string& daemon_uri, const string& daemon_username, const string& daemon_password, const string& language, emscripten::val callback);
  void create_core_wallet_from_mnemonic(const string& password, int network_type, const string& mnemonic, const string& daemon_uri, const string& daemon_username, const string& daemon_password, long restore_height, const string& seed_offset, emscripten::val callback);
  void create_core_wallet_from_keys(const string& password, int network_type, const string& address, const string& view_key, const string& spend_key, const string& daemon_uri, const string& daemon_username, const string& daemon_password, long restore_height, const string& language, emscripten::val callback);
  string get_core_wallet_mnemonic_languages();

  void create_keys_wallet_random(int network_type, const string& language, emscripten::val callback);
  void create_keys_wallet_from_mnemonic(int network_type, const string& mnemonic, const string& seed_offset, emscripten::val callback);
  void create_keys_wallet_from_keys(int network_type, const string& address, const string& view_key, const string& spend_key, const string& language, emscripten::val callback);
  string get_keys_wallet_mnemonic_languages();

  // ----------------------- WALLET INSTANCE METHODS --------------------------

  void set_daemon_connection(int handle, const string& uri, const string& username, const string& password, emscripten::val callback);
  string get_daemon_connection(int handle);
  void is_connected(int handle, emscripten::val callback);
  void get_daemon_max_peer_height(int handle, emscripten::val callback);
  string get_version(int handle);
  string get_mnemonic(int handle);
  string get_mnemonic_language(int handle);
  string get_public_view_key(int handle);
  string get_private_view_key(int handle);
  string get_public_spend_key(int handle);
  string get_private_spend_key(int handle);
  string get_address(int handle, const uint32_t account_idx, const uint32_t subaddress_idx);
  string get_address_index(int handle, const string& address);
  string get_integrated_address(int handle, const string& standard_address = "", const string& payment_id = "");
  string decode_integrated_address(int handle, const string& integrated_address);
  void get_height(int handle, emscripten::val callback);
  void get_daemon_height(int handle, emscripten::val callback);
  void is_daemon_synced(int handle, emscripten::val callback);
  void is_synced(int handle, emscripten::val callback);
  int get_network_type(int handle);
  long get_restore_height(int handle);
  void set_restore_height(int handle, long restore_height);
//  long get_daemon_height(int handle);
//  long get_daemon_max_peer_height(int handle);
  //void add_listener(int handle, monero_wallet_listener& listener);
  //void remove_listener(int handle, monero_wallet_listener& listener);
  //set<monero_wallet_listener*> get_listeners(int handle);
  int set_listener(int wallet_handle, int old_listener_handle, emscripten::val on_sync_progress = emscripten::val::undefined(), emscripten::val on_new_block = emscripten::val::undefined(), emscripten::val on_output_received = emscripten::val::undefined(), emscripten::val on_output_spent = emscripten::val::undefined());
  void sync(int handle, long start_height, emscripten::val callback);
  //  emscripten::function("start_syncing", &monero_wasm_bridge::start_syncing);
  //  emscripten::function("rescan_spent", &monero_wasm_bridge::rescan_spent);
  //  emscripten::function("rescan_blockchain", &monero_wasm_bridge::rescan_blockchain);
  string get_balance_wallet(int handle);
  string get_balance_account(int handle, const uint32_t account_idx);
  string get_balance_subaddress(int handle, const uint32_t account_idx, const uint32_t subaddress_idx);
  string get_unlocked_balance_wallet(int handle);
  string get_unlocked_balance_account(int handle, const uint32_t account_idx);
  string get_unlocked_balance_subaddress(int handle, const uint32_t account_idx, const uint32_t subaddress_idx);
  string get_accounts(int handle, bool include_subaddresses = false, const string& tag = "");
  string get_account(int handle, uint32_t account_idx, bool include_subaddresses = false);
  string create_account(int handle, const string& label);
  string get_subaddresses(int handle, const string& args);
  string create_subaddress(int handle, const uint32_t account_idx, const string& label);
  void get_txs(int handle, const string& tx_query_json, emscripten::val callback);
  void get_transfers(int handle, const string& transfer_query_json, emscripten::val callback);
  void get_outputs(int handle, const string& output_query_json, emscripten::val callback);
  void get_outputs_hex(int handle, emscripten::val callback);
  void import_outputs_hex(int handle, const string& outputs_hex, emscripten::val callback);
  void get_key_images(int handle, emscripten::val callback);
  void import_key_images(int handle, const string& key_images_str, emscripten::val callback);
  //  emscripten::function("get_new_key_images_from_last_import", &monero_wasm_bridge::get_new_key_images_from_last_import);
  //  emscripten::function("relay_txs", &monero_wasm_bridge::relay_txs);
  void send_split(int handle, const string& send_request_json, emscripten::val callback);
  //  emscripten::function("sweep_output", &monero_wasm_bridge::sweep_output);
  //  emscripten::function("sweep_unlocked", &monero_wasm_bridge::sweep_unlocked);
  //  emscripten::function("sweep_dust", &monero_wasm_bridge::sweep_dust);
  string sign(int handle, const string& msg);
  bool verify(int handle, const string& msg, const string& address, const string& signature);
  string get_tx_key(int handle, const string& tx_hash);
  string check_tx_key(int handle, const string& tx_hash, const string& tx_key, const string& address);
  string get_tx_proof(int handle, const string& tx_hash, const string& address, const string& message);
  string check_tx_proof(int handle, const string& tx_hash, const string& address, const string& message, const string& signature);
  string get_spend_proof(int handle, const string& tx_hash, const string& message);
  bool check_spend_proof(int handle, const string& tx_hash, const string& message, const string& signature);
  string get_reserve_proof_wallet(int handle, const string& message);
  string get_reserve_proof_account(int handle, uint32_t account_idx, const string& amount_str, const string& message);
  string check_reserve_proof(int handle, const string& address, const string& message, const string& signature);
  string get_tx_notes(int handle, const string& args);
  void set_tx_notes(int handle, const string& args);
  //  emscripten::function("get_address_book_entries", &monero_wasm_bridge::get_address_book_entries);
  //  emscripten::function("add_address_book_entry", &monero_wasm_bridge::add_address_book_entry);
  //  emscripten::function("delete_address_book_entry", &monero_wasm_bridge::delete_address_book_entry);
  //  emscripten::function("tag_accounts", &monero_wasm_bridge::tag_accounts);
  //  emscripten::function("untag_accounts", &monero_wasm_bridge::untag_accounts);
  //  emscripten::function("get_account_tags", &monero_wasm_bridge::get_account_tags);
  //  emscripten::function("set_account_tag_label", &monero_wasm_bridge::set_account_tag_label);
  //  emscripten::function("create_payment_uri", &monero_wasm_bridge::create_payment_uri);
  //  emscripten::function("parse_payment_uri", &monero_wasm_bridge::parse_payment_uri);
  string get_attribute(int handle, const string& key);
  void set_attribute(int handle, const string& key, const string& val);
  //  emscripten::function("start_mining", &monero_wasm_bridge::start_mining);
  //  emscripten::function("stop_mining", &monero_wasm_bridge::stop_mining);
  //  emscripten::function("is_multisig_import_needed", &monero_wasm_bridge::is_multisig_import_needed);
  //  emscripten::function("is_multisig", &monero_wasm_bridge::is_multisig);
  //  emscripten::function("get_multisig_info", &monero_wasm_bridge::get_multisig_info);
  //  emscripten::function("prepare_multisig", &monero_wasm_bridge::prepare_multisig);
  //  emscripten::function("make_multisig", &monero_wasm_bridge::make_multisig);
  //  emscripten::function("exchange_multisig_keys", &monero_wasm_bridge::exchange_multisig_keys);
  //  emscripten::function("get_multisig_hex", &monero_wasm_bridge::get_multisig_hex);
  //  emscripten::function("import_multisig_hex", &monero_wasm_bridge::import_multisig_hex);
  //  emscripten::function("sign_multisig_tx_hex", &monero_wasm_bridge::sign_multisig_tx_hex);
  //  emscripten::function("submit_multisig_tx_hex", &monero_wasm_bridge::submit_multisig_tx_hex);
  //  emscripten::function("save", &monero_wasm_bridge::save);
  void close(int handle, bool save, emscripten::val callback);
  string get_keys_file_buffer(int handle, string password, bool watch_only);
  string get_cache_file_buffer(int handle, string password);
}

#endif /* monero_wasm_bridge_h */
