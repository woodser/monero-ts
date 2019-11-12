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

void monero_wallet_wasm_bridge::open_wallet(const string& path, const string& password, int network_type, const string& keys_data, const string& cache_data, const string& daemon_uri, const string& daemon_username, const string& daemon_password, emscripten::val callback) {
  cout << "monero_wallet_wasm_bridge::open_wallet(...)" << endl;
  http_client_wasm* http_client = new http_client_wasm(); // TODO: this needs deleted after use
  monero_rpc_connection daemon_connection = monero_rpc_connection(daemon_uri, daemon_username, daemon_password);
  monero_wallet_base* wallet = monero_wallet_base::open_wallet(*http_client, password, static_cast<monero_network_type>(network_type), keys_data, cache_data, daemon_connection);
  callback((int) wallet); // invoke callback with wallet address
}

void monero_wallet_wasm_bridge::create_wallet_random(const string& path, const string& password, int network_type, const string& daemon_uri, const string& daemon_username, const string& daemon_password, const string& language, emscripten::val callback) {
    http_client_wasm* http_client = new http_client_wasm(); // TODO: this needs deleted after use
    monero_rpc_connection daemon_connection = monero_rpc_connection(daemon_uri, daemon_username, daemon_password);
    monero_wallet_base* wallet = monero_wallet_base::create_wallet_random(*http_client, path, password, static_cast<monero_network_type>(network_type), daemon_connection, language);
    callback((int) wallet); // invoke callback with wallet address
}

void monero_wallet_wasm_bridge::create_wallet_from_mnemonic(const string& path, const string& password, int network_type, const string& mnemonic, const string& daemon_uri, const string& daemon_username, const string& daemon_password, long restore_height, emscripten::val callback) {
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

string monero_wallet_wasm_bridge::get_languages(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  vector<string> languages = wallet->get_languages();

  // serialize languages as json string array
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value val = monero_utils::to_json_val(doc.GetAllocator(), languages);
  val.Swap(doc);
  return monero_utils::serialize(doc);
}

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
  cout << "monero_wallet_wasm_bridge::get_address_index(" << address << ")" << endl;
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  try {
    cout << "get_address_index 1" << endl;
    monero_subaddress subaddress = wallet->get_address_index(address);
    cout << "get_address_index 2" << endl;
    return subaddress.serialize();
  } catch (...) { // TODO: could replace with std::exception const& e
    cout << "CAUGHT EXCEPTION" << endl;
    return "BAD ADDRESS";
  }
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
  monero_sync_result result = wallet->sync();
  callback(result.serialize());
}

//  emscripten::function("start_syncing", &monero_wallet_wasm_bridge::start_syncing);
//  emscripten::function("rescan_spent", &monero_wallet_wasm_bridge::rescan_spent);
//  emscripten::function("rescan_blockchain", &monero_wallet_wasm_bridge::rescan_blockchain);

string monero_wallet_wasm_bridge::get_balance_wallet(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;

  // serialize wallet balance to json string {"balance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("balance", rapidjson::Value().SetUint64(wallet->get_balance()), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wallet_wasm_bridge::get_balance_account(int handle, const uint32_t account_idx) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;

  // serialize wallet balance to json string {"balance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("balance", rapidjson::Value().SetUint64(wallet->get_balance(account_idx)), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wallet_wasm_bridge::get_balance_subaddress(int handle, const uint32_t account_idx, const uint32_t subaddress_idx) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;

  // serialize wallet balance to json string {"balance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("balance", rapidjson::Value().SetUint64(wallet->get_balance(account_idx, subaddress_idx)), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wallet_wasm_bridge::get_unlocked_balance_wallet(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;

  // serialize wallet unlocked balance to json string {"unlockedBalance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("unlockedBalance", rapidjson::Value().SetUint64(wallet->get_unlocked_balance()), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wallet_wasm_bridge::get_unlocked_balance_account(int handle, const uint32_t account_idx) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;

  // serialize account unlocked balance to json string {"unlockedBalance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("unlockedBalance", rapidjson::Value().SetUint64(wallet->get_unlocked_balance(account_idx)), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wallet_wasm_bridge::get_unlocked_balance_subaddress(int handle, const uint32_t account_idx, const uint32_t subaddress_idx) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;

  // serialize subaddress unlocked balance to json string {"unlockedBalance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("unlockedBalance", rapidjson::Value().SetUint64(wallet->get_unlocked_balance(account_idx, subaddress_idx)), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wallet_wasm_bridge::get_accounts(int handle, bool include_subaddresses, const string& tag) {

  // get accounts
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  vector<monero_account> accounts = wallet->get_accounts(include_subaddresses, tag);

  // wrap and serialize accounts
  rapidjson::Document doc;
  doc.SetObject();
  doc.AddMember("accounts", monero_utils::to_json_val(doc.GetAllocator(), accounts), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wallet_wasm_bridge::get_account(int handle, uint32_t account_idx, bool include_subaddresses) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  monero_account account = wallet->get_account(account_idx, include_subaddresses);
  return account.serialize();
}

//  emscripten::function("create_account", &monero_wallet_wasm_bridge::create_account);

string monero_wallet_wasm_bridge::get_subaddresses(int handle, const string& args) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;

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
  vector<monero_subaddress> subaddresses = wallet->get_subaddresses(account_idx, subaddress_indices);

  // wrap and serialize subaddresses
  rapidjson::Document doc;
  doc.SetObject();
  doc.AddMember("subaddresses", monero_utils::to_json_val(doc.GetAllocator(), subaddresses), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

//  emscripten::function("create_subaddress", &monero_wallet_wasm_bridge::create_subaddress);

void monero_wallet_wasm_bridge::get_txs(int handle, const string& tx_query_str, emscripten::val callback) {
  cout << "monero_wallet_wasm_bridge::get_txs()" << endl;
  monero_wallet_base* wallet = (monero_wallet_base*) handle;

  // deserialize tx query string
  shared_ptr<monero_tx_query> tx_query = monero_utils::deserialize_tx_query(tx_query_str);
  cout << "Fetching tx with query: " << tx_query->serialize();

  // get txs
  cout << "FETCHING TXS" << endl;
  vector<shared_ptr<monero_tx_wallet>> txs = wallet->get_txs(*tx_query);
  cout << "Got " << txs.size() << " txs" << endl;

  // collect unique blocks to preserve model relationships as tree
  shared_ptr<monero_block> unconfirmed_block = nullptr; // placeholder to store unconfirmed txs in return json
  vector<shared_ptr<monero_block>> blocks;
  unordered_set<shared_ptr<monero_block>> seen_block_ptrs;
  for (const shared_ptr<monero_tx_wallet>& tx : txs) {
    if (tx->m_block == boost::none) {
      if (unconfirmed_block == nullptr) unconfirmed_block = shared_ptr<monero_block>(new monero_block());
      tx->m_block = unconfirmed_block;
      unconfirmed_block->m_txs.push_back(tx);
    }
    unordered_set<shared_ptr<monero_block>>::const_iterator got = seen_block_ptrs.find(tx->m_block.get());
    if (got == seen_block_ptrs.end()) {
      seen_block_ptrs.insert(tx->m_block.get());
      blocks.push_back(tx->m_block.get());
    }
  }
  cout << "Returning " << blocks.size() << " blocks" << endl;

  // return wrapped and serialized blocks
  rapidjson::Document doc;
  doc.SetObject();
  doc.AddMember("blocks", monero_utils::to_json_val(doc.GetAllocator(), blocks), doc.GetAllocator());
  callback(monero_utils::serialize(doc));
}

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
//  emscripten::function("get_attribute", &monero_wallet_wasm_bridge::get_attribute);

  string monero_wallet_wasm_bridge::get_attribute(int handle, const string& key) {
    monero_wallet_base* wallet = (monero_wallet_base*) handle;
    return wallet->get_attribute(key);
  }

  void monero_wallet_wasm_bridge::set_attribute(int handle, const string& key, const string& val) {
    monero_wallet_base* wallet = (monero_wallet_base*) handle;
    wallet->set_attribute(key, val);
  }

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

void monero_wallet_wasm_bridge::close(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  return wallet->close();
}

string monero_wallet_wasm_bridge::get_address_file_buffer(int handle) {
  monero_wallet_base* wallet = (monero_wallet_base*) handle;
  return wallet->get_address_file_buffer();
}
string monero_wallet_wasm_bridge::get_keys_file_buffer(int handle, string password, bool watch_only) {

  // get wallet
  monero_wallet_base* wallet = (monero_wallet_base*) handle;

  // get keys buffer
  string keys_buf = wallet->get_keys_file_buffer(password, watch_only);

  // copy keys buffer to heap and keep pointer
  std::string* keys_buf_ptr = new std::string(keys_buf.c_str(), keys_buf.length());

  // serialize buffer's pointer and length
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("pointer", rapidjson::Value().SetUint64(reinterpret_cast<long>(keys_buf_ptr->c_str())), doc.GetAllocator());
  doc.AddMember("length", rapidjson::Value().SetUint64(keys_buf_ptr->length()), doc.GetAllocator());
  return monero_utils::serialize(doc);
}
string monero_wallet_wasm_bridge::get_cache_file_buffer(int handle, string password) {

  // get wallet
  monero_wallet_base* wallet = (monero_wallet_base*) handle;

  // get cache buffer
  string cache_buf = wallet->get_cache_file_buffer(password);

  // copy cache buffer to heap and keep pointer
  std::string* cache_buf_ptr = new std::string(cache_buf.c_str(), cache_buf.length());

  // serialize buffer's pointer and length
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("pointer", rapidjson::Value().SetUint64(reinterpret_cast<long>(cache_buf_ptr->c_str())), doc.GetAllocator());
  doc.AddMember("length", rapidjson::Value().SetUint64(cache_buf_ptr->length()), doc.GetAllocator());
  return monero_utils::serialize(doc);
}
