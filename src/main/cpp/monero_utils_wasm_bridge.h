/**
 * Provides a bridge from WebAssembly to Monero utils.
 */
#ifndef monero_utils_wasm_bridge_h
#define monero_utils_wasm_bridge_h

#include <string>

using namespace std;

namespace monero_utils_wasm_bridge
{
  void utils_dummy_method();
  string malloc_binary_from_json(const string &args_string);
  string binary_to_json(const string &args_string);
  string binary_blocks_to_json(const string &args_string);
}

#endif /* monero_utils_wasm_bridge_h */
