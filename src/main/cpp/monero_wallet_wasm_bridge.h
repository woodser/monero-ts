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
  void create_wallet_random(const string& path, const string& password, int network_type, const string& daemon_uri, const string& daemon_username, const string& daemon_password, const string& language, emscripten::val callback);
  void create_wallet_from_mnemonic(const string& path, const string& password, int network_type, const string& mnemonic, const string& daemon_uri, const string& daemon_username, const string& daemon_password, long restore_height, emscripten::val callback);
  int create_wallet_dummy();
  void dummy_method(int handle);
}

#endif /* monero_wallet_wasm_bridge_h */
