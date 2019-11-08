#include <iostream>
#include "monero_wallet_wasm_bridge.h"
#include "wallet/monero_wallet_dummy.h"
#include "wallet/monero_wallet_base.h"
#include "http_client_wasm.h"
#include "utils/monero_utils.h"

 // TODO: remove
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"
#include <emscripten.h>

using namespace std;
using namespace monero_wallet_wasm_bridge;

void my_int_func(int x)
{
    printf( "%d\n", x );
}

string strip_last_char(const string& str) {
  return str.substr(0, str.size() - 1);
}

// ------------------------- INITIALIZE CONSTANTS ---------------------------

static const int DEFAULT_SYNC_INTERVAL_MILLIS = 1000 * 10;   // default refresh interval 10 sec
static const int DEFAULT_CONNECTION_TIMEOUT_MILLIS = 1000 * 30; // default connection timeout 30 sec

int monero_wallet_wasm_bridge::create_wallet_dummy() {
  monero_wallet_dummy* wallet = new monero_wallet_dummy();
  return (int) wallet;
}

void monero_wallet_wasm_bridge::dummy_method(int handle) {
  monero_wallet_dummy* wallet = (monero_wallet_dummy*) handle;
  wallet->dummy_method();
}

void monero_wallet_wasm_bridge::create_wallet_random(const string& path, const string& password, int network_type, const string& daemon_uri, const string& daemon_username, const string& daemon_password, const string& language, emscripten::val callback) {
    cout << "create_wallet_random() called!!!" << endl;
    http_client_wasm* http_client = new http_client_wasm(); // TODO: this needs deleted after use
    monero_rpc_connection daemon_connection = monero_rpc_connection(daemon_uri, daemon_username, daemon_password);
    monero_wallet_base* wallet = monero_wallet_base::create_wallet_random(*http_client, path, password, static_cast<monero_network_type>(network_type), daemon_connection, language);
    callback((int) wallet); // invoke callback with wallet address
}

void monero_wallet_wasm_bridge::create_wallet_from_mnemonic(const string& path, const string& password, int network_type, const string& mnemonic, const string& daemon_uri, const string& daemon_username, const string& daemon_password, long restore_height, emscripten::val callback) {
  cout << "create_wallet_from_mnemonic() called!!!" << endl;
  http_client_wasm* http_client = new http_client_wasm(); // TODO: this needs deleted after use
  monero_rpc_connection daemon_connection = monero_rpc_connection(daemon_uri, daemon_username, daemon_password);
  monero_wallet_base* wallet = monero_wallet_base::create_wallet_from_mnemonic(*http_client, path, password, static_cast<monero_network_type>(network_type), mnemonic, daemon_connection, restore_height);
  callback((int) wallet); // invoke callback with wallet address
}

//  void set_daemon_connection(int handle, const string& uri, const string& username = "", const string& password = "");
//  string get_daemon_connection(int handle) const;
//  bool is_connected(int handle) const;
//  bool is_daemon_synced(int handle) const;
//  bool is_daemon_trusted(int handle) const;
//  bool is_synced(int handle) const;
//  int get_network_type(int handle) const;

string monero_wallet_wasm_bridge::get_seed(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  return wallet->get_seed();
}

string monero_wallet_wasm_bridge::get_mnemonic(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  return wallet->get_mnemonic();
}

string monero_wallet_wasm_bridge::get_language(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  return wallet->get_language();
}

//vector<string> monero_wallet_wasm_bridge::get_languages() {
//  cout << "monero_wallet_wasm_bridge::get_languages()" << endl;
//  throw runtime_error("not implemented");
//}

string monero_wallet_wasm_bridge::get_public_view_key(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  return wallet->get_public_view_key();
}

string monero_wallet_wasm_bridge::get_private_view_key(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  return wallet->get_private_view_key();
}

string monero_wallet_wasm_bridge::get_public_spend_key(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  return wallet->get_public_spend_key();
}

string monero_wallet_wasm_bridge::get_private_spend_key(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  return wallet->get_private_spend_key();
}

string monero_wallet_wasm_bridge::get_address(int handle, const uint32_t account_idx, const uint32_t subaddress_idx) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  return wallet->get_address(account_idx, subaddress_idx);
}

string monero_wallet_wasm_bridge::get_address_index(int handle, const string& address) {
  cout << "monero_wallet_wasm_bridge::get_address_index()" << endl;
  throw runtime_error("not implemented");
}

string monero_wallet_wasm_bridge::get_integrated_address(int handle, const string& standard_address, const string& payment_id) {
  cout << "monero_wallet_wasm_bridge::get_integrated_address()" << endl;
  throw runtime_error("not implemented");
}

string monero_wallet_wasm_bridge::decode_integrated_address(int handle, const string& integrated_address) {
  cout << "monero_wallet_wasm_bridge::decode_integrated_address()" << endl;
  throw runtime_error("not implemented");
}

void monero_wallet_wasm_bridge::get_height(int handle, emscripten::val callback) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  uint64_t height = wallet->get_height();
  callback((long) height);
}

//  long get_restore_height(int handle) const;
//  void set_restore_height(int handle, long restore_height);
//  long get_daemon_height(int handle) const;
//  long get_daemon_max_peer_height(int handle) const;
  //void add_listener(int handle, monero_wallet_listener& listener);
  //void remove_listener(int handle, monero_wallet_listener& listener);
  //set<monero_wallet_listener*> get_listeners(int handle);

void monero_wallet_wasm_bridge::sync(int handle, emscripten::val callback) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  wallet->sync();
  callback(string("{my_serialized_sync_result}"));
}

string monero_wallet_wasm_bridge::get_accounts(int handle, bool include_subaddresses, const string& tag) {

  // get accounts
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  vector<monero_account> accounts = wallet->get_accounts(include_subaddresses, tag);

  // wrap and serialize accounts
  std::stringstream ss;
  boost::property_tree::ptree container;
  if (!accounts.empty()) container.add_child("accounts", monero_utils::to_property_tree(accounts));
  boost::property_tree::write_json(ss, container, false);
  return strip_last_char(ss.str());
}

string monero_wallet_wasm_bridge::get_account(int handle, uint32_t account_idx, bool include_subaddresses) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  monero_account account = wallet->get_account(account_idx, include_subaddresses);

  cout << "Attempting to serialize using RAPIDJSON" << endl;
  rapidjson::Document doc = account.to_rapid_json();
  string temp = monero_utils::serialize(doc);
  cout << "RAPIDJSON SERIALIZED ACCOUNT: " << temp << endl;

  return account.serialize();
}

string monero_wallet_wasm_bridge::get_subaddresses(int handle, const string& args) {

  // deserialize args to property tree
  std::istringstream iss = std::istringstream(args);
  boost::property_tree::ptree node;
  boost::property_tree::read_json(iss, node);

  // get account index argument
  uint32_t account_idx = node.get_child("accountIdx").get_value<uint32_t>();

  // get subaddresses indices argument
  vector<uint32_t> subaddress_indices;
  for (const auto& item : node.get_child("subaddressIndices")) {
    subaddress_indices.push_back(item.second.get_value<uint32_t>());
  }

  // get subaddresses
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  vector<monero_subaddress> subaddresses = wallet->get_subaddresses(account_idx, subaddress_indices);

  // wrap and serialize subaddresses
  std::stringstream ss;
  boost::property_tree::ptree container;
  if (!subaddresses.empty()) container.add_child("subaddresses", monero_utils::to_property_tree(subaddresses));
  boost::property_tree::write_json(ss, container, false);
  return strip_last_char(ss.str());
}

void monero_wallet_wasm_bridge::get_encrypted_text(int handle, emscripten::val callback) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  callback(wallet->get_encrypted_text());
}
