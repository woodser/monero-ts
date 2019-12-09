#include <iostream>
#include "monero_wasm_bridge.h"
#include "wallet/monero_wallet_keys.h"
#include "utils/monero_utils.h"
//#include "wallet/monero_wallet_core.h"
//#include "http_client_wasm.h"

 // TODO: remove
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"
#include <emscripten.h>

using namespace std;
using namespace monero_wasm_bridge;

// ----------------------------- PRIVATE INNER --------------------------------

static const int DEFAULT_SYNC_INTERVAL_MILLIS = 1000 * 10;   // default refresh interval 10 sec
static const int DEFAULT_CONNECTION_TIMEOUT_MILLIS = 1000 * 30; // default connection timeout 30 sec

string strip_last_char(const string& str) {
  return str.substr(0, str.size() - 1);
}

// ------------------------------- UTILITIES ----------------------------------

string monero_wasm_bridge::malloc_binary_from_json(const std::string &buff_json)
{
  // convert json to binary string
  string buff_bin;
  monero_utils::json_to_binary(buff_json, buff_bin);

  // copy binary string to heap and keep pointer
  std::string* ptr = new std::string(buff_bin.c_str(), buff_bin.length());

  // create object with binary string memory address info
  boost::property_tree::ptree root;
  root.put("ptr", reinterpret_cast<intptr_t>(ptr->c_str()));
  root.put("length", ptr->length());

  // serialize memory info to json str
  return monero_utils::serialize(root); // TODO: move this utility to gen_utils?
}

string monero_wasm_bridge::binary_to_json(const std::string &bin_mem_info_str)
{
  // deserialize memory address info to json
  boost::property_tree::ptree root;
  monero_utils::deserialize(bin_mem_info_str, root);

  // get ptr and length of binary data
  char* ptr = (char*) root.get<int>("ptr"); // TODO: reinterpret_cast<intptr_t>?
  int length = root.get<int>("length");

  // read binary
  std::string buff_bin(ptr, length);

  // convert binary to json and return
  std::string buff_json;
  monero_utils::binary_to_json(buff_bin, buff_json);
  return buff_json;
}

string monero_wasm_bridge::binary_blocks_to_json(const std::string &bin_mem_info_str)
{
  // deserialize memory address info to json
  boost::property_tree::ptree root;
  monero_utils::deserialize(bin_mem_info_str, root);

  // get ptr and length of binary data
  char* ptr = (char*) root.get<int>("ptr"); // TODO: reinterpret_cast<intptr_t>?
  int length = root.get<int>("length");

  // read binary
  std::string buff_bin(ptr, length);

  // convert binary to json and return
  std::string buff_json;
  monero_utils::binary_blocks_to_json(buff_bin, buff_json);
  return buff_json;
}

// -------------------------- STATIC WALLET UTILS -----------------------------

//void monero_wasm_bridge::open_wallet(const string& path, const string& password, int network_type, const string& keys_data, const string& cache_data, const string& daemon_uri, const string& daemon_username, const string& daemon_password, emscripten::val callback) {
//  cout << "monero_wasm_bridge::open_wallet(...)" << endl;
//  http_client_wasm* http_client = new http_client_wasm(); // TODO: this needs deleted after use
//  monero_rpc_connection daemon_connection = monero_rpc_connection(daemon_uri, daemon_username, daemon_password);
//  monero_wallet* wallet = monero_wallet::open_wallet(*http_client, password, static_cast<monero_network_type>(network_type), keys_data, cache_data, daemon_connection);
//  callback((int) wallet); // invoke callback with wallet address
//}
//
//void monero_wasm_bridge::create_wallet_random(const string& path, const string& password, int network_type, const string& daemon_uri, const string& daemon_username, const string& daemon_password, const string& language, emscripten::val callback) {
//    http_client_wasm* http_client = new http_client_wasm(); // TODO: this needs deleted after use
//    monero_rpc_connection daemon_connection = monero_rpc_connection(daemon_uri, daemon_username, daemon_password);
//    monero_wallet* wallet = monero_wallet::create_wallet_random(*http_client, path, password, static_cast<monero_network_type>(network_type), daemon_connection, language);
//    callback((int) wallet); // invoke callback with wallet address
//}
//
//void monero_wasm_bridge::create_wallet_from_mnemonic(const string& path, const string& password, int network_type, const string& mnemonic, const string& daemon_uri, const string& daemon_username, const string& daemon_password, long restore_height, emscripten::val callback) {
//  http_client_wasm* http_client = new http_client_wasm(); // TODO: this needs deleted after use
//  monero_rpc_connection daemon_connection = monero_rpc_connection(daemon_uri, daemon_username, daemon_password);
//  monero_wallet* wallet = monero_wallet::create_wallet_from_mnemonic(*http_client, path, password, static_cast<monero_network_type>(network_type), mnemonic, daemon_connection, restore_height);
//  callback((int) wallet); // invoke callback with wallet address
//}

void monero_wasm_bridge::create_keys_wallet_random(int network_type, const string& language, emscripten::val callback) {
  monero_wallet* wallet = monero_wallet_keys::create_wallet_random(static_cast<monero_network_type>(network_type), language);
  callback((int) wallet); // callback with wallet address
}

void monero_wasm_bridge::create_keys_wallet_from_mnemonic(int network_type, const string& mnemonic, emscripten::val callback) {
  monero_wallet* wallet = monero_wallet_keys::create_wallet_from_mnemonic(static_cast<monero_network_type>(network_type), mnemonic);
  callback((int) wallet); // callback with wallet address
}

void monero_wasm_bridge::create_keys_wallet_from_keys(int network_type, const string& address, const string& view_key, const string& spend_key, const string& language, emscripten::val callback) {
  monero_wallet* wallet = monero_wallet_keys::create_wallet_from_keys(static_cast<monero_network_type>(network_type), address, view_key, spend_key);
  callback((int) wallet); // callback with wallet address
}

vector<string> monero_wasm_bridge::get_keys_wallet_mnemonic_languages() {
  vector<string> languages = monero_wallet_keys::get_mnemonic_languages();
  cout << "Got " << languages.size() << " languages for the mnemonic phrase";
  return languages;
}

// ------------------------ WALLET INSTANCE METHODS ---------------------------

//  void set_daemon_connection(int handle, const string& uri, const string& username = "", const string& password = "");
//  string get_daemon_connection(int handle) const;
//  bool is_connected(int handle) const;
//  bool is_daemon_synced(int handle) const;
//  bool is_daemon_trusted(int handle) const;
//  bool is_synced(int handle) const;
//  int get_network_type(int handle) const;

string monero_wasm_bridge::get_mnemonic(int handle) {
  monero_wallet* wallet = (monero_wallet*) handle;
  return wallet->get_mnemonic();
}

string monero_wasm_bridge::get_mnemonic_language(int handle) {
  monero_wallet* wallet = (monero_wallet*) handle;
  return wallet->get_mnemonic_language();
}

//string monero_wasm_bridge::get_mnemonic_languages(int handle) {
//  monero_wallet* wallet = (monero_wallet*) handle;
//  vector<string> languages = wallet->get_mnemonic_languages();
//
//  // serialize languages as json string array
//  rapidjson::Document doc;
//  doc.SetObject();
//  rapidjson::Value val = monero_utils::to_rapidjson_val(doc.GetAllocator(), languages);
//  val.Swap(doc);
//  return monero_utils::serialize(doc);
//}

string monero_wasm_bridge::get_public_view_key(int handle) {
  monero_wallet* wallet = (monero_wallet*) handle;
  return wallet->get_public_view_key();
}

string monero_wasm_bridge::get_private_view_key(int handle) {
  monero_wallet* wallet = (monero_wallet*) handle;
  return wallet->get_private_view_key();
}

string monero_wasm_bridge::get_public_spend_key(int handle) {
  monero_wallet* wallet = (monero_wallet*) handle;
  return wallet->get_public_spend_key();
}

string monero_wasm_bridge::get_private_spend_key(int handle) {
  monero_wallet* wallet = (monero_wallet*) handle;
  return wallet->get_private_spend_key();
}

string monero_wasm_bridge::get_address(int handle, const uint32_t account_idx, const uint32_t subaddress_idx) {
  monero_wallet* wallet = (monero_wallet*) handle;
  return wallet->get_address(account_idx, subaddress_idx);
}

string monero_wasm_bridge::get_address_index(int handle, const string& address) {
  cout << "monero_wasm_bridge::get_address_index(" << address << ")" << endl;
  monero_wallet* wallet = (monero_wallet*) handle;
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

string monero_wasm_bridge::get_integrated_address(int handle, const string& standard_address, const string& payment_id) {
  cout << "monero_wasm_bridge::get_integrated_address()" << endl;
  throw runtime_error("not implemented");
}

string monero_wasm_bridge::decode_integrated_address(int handle, const string& integrated_address) {
  cout << "monero_wasm_bridge::decode_integrated_address()" << endl;
  throw runtime_error("not implemented");
}

void monero_wasm_bridge::get_height(int handle, emscripten::val callback) {
  monero_wallet* wallet = (monero_wallet*) handle;
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

void monero_wasm_bridge::sync(int handle, emscripten::val callback) {
  monero_wallet* wallet = (monero_wallet*) handle;
  monero_sync_result result = wallet->sync();
  callback(result.serialize());
}

//  emscripten::function("start_syncing", &monero_wasm_bridge::start_syncing);
//  emscripten::function("rescan_spent", &monero_wasm_bridge::rescan_spent);
//  emscripten::function("rescan_blockchain", &monero_wasm_bridge::rescan_blockchain);

string monero_wasm_bridge::get_balance_wallet(int handle) {
  monero_wallet* wallet = (monero_wallet*) handle;

  // serialize wallet balance to json string {"balance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("balance", rapidjson::Value().SetUint64(wallet->get_balance()), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wasm_bridge::get_balance_account(int handle, const uint32_t account_idx) {
  monero_wallet* wallet = (monero_wallet*) handle;

  // serialize wallet balance to json string {"balance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("balance", rapidjson::Value().SetUint64(wallet->get_balance(account_idx)), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wasm_bridge::get_balance_subaddress(int handle, const uint32_t account_idx, const uint32_t subaddress_idx) {
  monero_wallet* wallet = (monero_wallet*) handle;

  // serialize wallet balance to json string {"balance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("balance", rapidjson::Value().SetUint64(wallet->get_balance(account_idx, subaddress_idx)), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wasm_bridge::get_unlocked_balance_wallet(int handle) {
  monero_wallet* wallet = (monero_wallet*) handle;

  // serialize wallet unlocked balance to json string {"unlockedBalance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("unlockedBalance", rapidjson::Value().SetUint64(wallet->get_unlocked_balance()), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wasm_bridge::get_unlocked_balance_account(int handle, const uint32_t account_idx) {
  monero_wallet* wallet = (monero_wallet*) handle;

  // serialize account unlocked balance to json string {"unlockedBalance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("unlockedBalance", rapidjson::Value().SetUint64(wallet->get_unlocked_balance(account_idx)), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wasm_bridge::get_unlocked_balance_subaddress(int handle, const uint32_t account_idx, const uint32_t subaddress_idx) {
  monero_wallet* wallet = (monero_wallet*) handle;

  // serialize subaddress unlocked balance to json string {"unlockedBalance": ...}
  rapidjson::Document doc;
  doc.SetObject();
  rapidjson::Value value;
  doc.AddMember("unlockedBalance", rapidjson::Value().SetUint64(wallet->get_unlocked_balance(account_idx, subaddress_idx)), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wasm_bridge::get_accounts(int handle, bool include_subaddresses, const string& tag) {

  // get accounts
  monero_wallet* wallet = (monero_wallet*) handle;
  vector<monero_account> accounts = wallet->get_accounts(include_subaddresses, tag);

  // wrap and serialize accounts
  rapidjson::Document doc;
  doc.SetObject();
  doc.AddMember("accounts", monero_utils::to_rapidjson_val(doc.GetAllocator(), accounts), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

string monero_wasm_bridge::get_account(int handle, uint32_t account_idx, bool include_subaddresses) {
  monero_wallet* wallet = (monero_wallet*) handle;
  monero_account account = wallet->get_account(account_idx, include_subaddresses);
  return account.serialize();
}

//  emscripten::function("create_account", &monero_wasm_bridge::create_account);

string monero_wasm_bridge::get_subaddresses(int handle, const string& args) {
  monero_wallet* wallet = (monero_wallet*) handle;

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
  doc.AddMember("subaddresses", monero_utils::to_rapidjson_val(doc.GetAllocator(), subaddresses), doc.GetAllocator());
  return monero_utils::serialize(doc);
}

//  emscripten::function("create_subaddress", &monero_wasm_bridge::create_subaddress);

void monero_wasm_bridge::get_txs(int handle, const string& tx_query_json, emscripten::val callback) {
  monero_wallet* wallet = (monero_wallet*) handle;

  // deserialize tx query string
  shared_ptr<monero_tx_query> tx_query = monero_tx_query::deserialize_from_block(tx_query_json);

  // get txs
  vector<string> missing_tx_ids;
  vector<shared_ptr<monero_tx_wallet>> txs = wallet->get_txs(*tx_query, missing_tx_ids);

  // return error as string if missing requested tx hashes
  if (!missing_tx_ids.empty()) {
    callback("Tx not found in wallet: " + missing_tx_ids[0]);
    return;
  }

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

  // wrap and serialize blocks
  rapidjson::Document doc;
  doc.SetObject();
  doc.AddMember("blocks", monero_utils::to_rapidjson_val(doc.GetAllocator(), blocks), doc.GetAllocator());
  callback(monero_utils::serialize(doc));
}

//  emscripten::function("get_txs", &monero_wasm_bridge::get_txs);
//  emscripten::function("get_transfers", &monero_wasm_bridge::get_transfers);
//  emscripten::function("get_incoming_transfers", &monero_wasm_bridge::TODO);
//  emscripten::function("get_outgoing_transfers", &monero_wasm_bridge::TODO);
//  emscripten::function("get_outputs", &monero_wasm_bridge::get_outputs);
//  emscripten::function("get_outputs_hex", &monero_wasm_bridge::get_outputs_hex);
//  emscripten::function("import_outputs_hex", &monero_wasm_bridge::import_outputs_hex);
//  emscripten::function("get_key_images", &monero_wasm_bridge::get_key_images);
//  emscripten::function("import_key_images", &monero_wasm_bridge::import_key_images);
//  emscripten::function("get_new_key_images_from_last_import", &monero_wasm_bridge::get_new_key_images_from_last_import);
//  emscripten::function("relay_txs", &monero_wasm_bridge::relay_txs);

void monero_wasm_bridge::send_split(int handle, const string& send_request_json, emscripten::val callback) {
  monero_wallet* wallet = (monero_wallet*) handle;
  cout << "monero_wasm_bridge::send_split()" << endl;
  cout << send_request_json << endl;

  // deserialize send request
  shared_ptr<monero_send_request> send_request = monero_send_request::deserialize(send_request_json);
  cout << "Deserialized send request, re-serialized: " << send_request->serialize() << endl;

  cout << "Calling send_split() " << endl;

  // submit send request
  monero_tx_set tx_set = wallet->send_split(*send_request);

  cout << "Returned from send_split(), calling tx_set serialize()" << endl;

  // serialize and return tx set
  callback(tx_set.serialize());
}

//  emscripten::function("sweep_output", &monero_wasm_bridge::sweep_output);
//  emscripten::function("sweep_unlocked", &monero_wasm_bridge::sweep_unlocked);
//  emscripten::function("sweep_dust", &monero_wasm_bridge::sweep_dust);
//  emscripten::function("sign", &monero_wasm_bridge::sign);
//  emscripten::function("verify", &monero_wasm_bridge::verify);
//  emscripten::function("get_tx_key", &monero_wasm_bridge::get_tx_key);
//  emscripten::function("check_tx_key", &monero_wasm_bridge::check_tx_key);
//  emscripten::function("get_tx_proof", &monero_wasm_bridge::get_tx_proof);
//  emscripten::function("check_tx_proof", &monero_wasm_bridge::check_tx_proof);
//  emscripten::function("get_spend_proof", &monero_wasm_bridge::get_spend_proof);
//  emscripten::function("check_spend_proof", &monero_wasm_bridge::check_spend_proof);
//  emscripten::function("get_reserve_proof_wallet", &monero_wasm_bridge::get_reserve_proof_wallet);
//  emscripten::function("get_reserve_proof_account", &monero_wasm_bridge::get_reserve_proof_account);
//  emscripten::function("check_reserve_proof", &monero_wasm_bridge::check_reserve_proof);
//  emscripten::function("get_tx_notes", &monero_wasm_bridge::get_tx_notes);
//  emscripten::function("set_tx_notes", &monero_wasm_bridge::set_tx_notes);
//  emscripten::function("get_address_book_entries", &monero_wasm_bridge::get_address_book_entries);
//  emscripten::function("add_address_book_entry", &monero_wasm_bridge::add_address_book_entry);
//  emscripten::function("delete_address_book_entry", &monero_wasm_bridge::delete_address_book_entry);
//  emscripten::function("tag_accounts", &monero_wasm_bridge::tag_accounts);
//  emscripten::function("untag_accounts", &monero_wasm_bridge::untag_accounts);
//  emscripten::function("get_account_tags", &monero_wasm_bridge::get_account_tags);
//  emscripten::function("set_account_tag_label", &monero_wasm_bridge::set_account_tag_label);
//  emscripten::function("create_payment_uri", &monero_wasm_bridge::create_payment_uri);
//  emscripten::function("parse_payment_uri", &monero_wasm_bridge::parse_payment_uri);
//  emscripten::function("get_attribute", &monero_wasm_bridge::get_attribute);

  string monero_wasm_bridge::get_attribute(int handle, const string& key) {
    monero_wallet* wallet = (monero_wallet*) handle;
    string value;
    if (!wallet->get_attribute(key, value)) return "";
    return value;
  }

  void monero_wasm_bridge::set_attribute(int handle, const string& key, const string& val) {
    monero_wallet* wallet = (monero_wallet*) handle;
    wallet->set_attribute(key, val);
  }

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

void monero_wasm_bridge::close(int handle) {
  monero_wallet* wallet = (monero_wallet*) handle;
  return wallet->close();
}

//string monero_wasm_bridge::get_address_file_buffer(int handle) {
//  monero_wallet* wallet = (monero_wallet*) handle;
//  return wallet->get_address_file_buffer();
//}
//
//string monero_wasm_bridge::get_keys_file_buffer(int handle, string password, bool watch_only) {
//
//  // get wallet
//  monero_wallet* wallet = (monero_wallet*) handle;
//
//  // get keys buffer
//  string keys_buf = wallet->get_keys_file_buffer(password, watch_only);
//
//  // copy keys buffer to heap and keep pointer
//  std::string* keys_buf_ptr = new std::string(keys_buf.c_str(), keys_buf.length());
//
//  // serialize buffer's pointer and length
//  rapidjson::Document doc;
//  doc.SetObject();
//  rapidjson::Value value;
//  doc.AddMember("pointer", rapidjson::Value().SetUint64(reinterpret_cast<long>(keys_buf_ptr->c_str())), doc.GetAllocator());
//  doc.AddMember("length", rapidjson::Value().SetUint64(keys_buf_ptr->length()), doc.GetAllocator());
//  return monero_utils::serialize(doc);
//}
//
//string monero_wasm_bridge::get_cache_file_buffer(int handle, string password) {
//
//  // get wallet
//  monero_wallet* wallet = (monero_wallet*) handle;
//
//  // get cache buffer
//  string cache_buf = wallet->get_cache_file_buffer(password);
//
//  // copy cache buffer to heap and keep pointer
//  std::string* cache_buf_ptr = new std::string(cache_buf.c_str(), cache_buf.length());
//
//  // serialize buffer's pointer and length
//  rapidjson::Document doc;
//  doc.SetObject();
//  rapidjson::Value value;
//  doc.AddMember("pointer", rapidjson::Value().SetUint64(reinterpret_cast<long>(cache_buf_ptr->c_str())), doc.GetAllocator());
//  doc.AddMember("length", rapidjson::Value().SetUint64(cache_buf_ptr->length()), doc.GetAllocator());
//  return monero_utils::serialize(doc);
//}
