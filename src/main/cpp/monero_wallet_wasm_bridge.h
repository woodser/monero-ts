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

  unsigned long get_balance_wallet(int handle);
  unsigned long get_balance_account(int handle, const uint32_t account_idx);
  unsigned long get_balance_subaddress(int handle, const uint32_t account_idx, const uint32_t subaddress_idx);
  unsigned long get_unlocked_balance_wallet(int handle);
  unsigned long get_unlocked_balance_account(int handle, const uint32_t account_idx);
  unsigned long get_unlocked_balance_subaddress(int handle, const uint32_t account_idx, const uint32_t subaddress_idx);
  string get_accounts(int handle, bool include_subaddresses = false, const string& tag = "");
  string get_account(int handle, uint32_t account_idx, bool include_subaddresses = false);
  string get_subaddresses(int handle, const string& args);
  void get_encrypted_text(int handle, emscripten::val callback);
}

#endif /* monero_wallet_wasm_bridge_h */
