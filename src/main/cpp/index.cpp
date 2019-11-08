#include <stdio.h>
#include <emscripten/bind.h>
//#include <emscripten.h>

#include "monero_wallet_wasm_bridge.h"
#include "monero_utils_wasm_bridge.h"

// register bindings from JS to C++ using emscripten
EMSCRIPTEN_BINDINGS(module)
{
  // register utility bindings
  emscripten::function("utils_dummy_method", &monero_utils_wasm_bridge::utils_dummy_method);
  emscripten::function("malloc_binary_from_json", &monero_utils_wasm_bridge::malloc_binary_from_json);
  emscripten::function("binary_to_json", &monero_utils_wasm_bridge::binary_to_json);
  emscripten::function("binary_blocks_to_json", &monero_utils_wasm_bridge::binary_blocks_to_json);

  // register wallet bindings
  emscripten::function("create_wallet_dummy", &monero_wallet_wasm_bridge::create_wallet_dummy);
  emscripten::function("dummy_method", &monero_wallet_wasm_bridge::dummy_method);
  emscripten::function("create_wallet_random", &monero_wallet_wasm_bridge::create_wallet_random);
  emscripten::function("create_wallet_from_mnemonic", &monero_wallet_wasm_bridge::create_wallet_from_mnemonic);
  emscripten::function("get_seed", &monero_wallet_wasm_bridge::get_seed);
  emscripten::function("get_mnemonic", &monero_wallet_wasm_bridge::get_mnemonic);
  emscripten::function("get_language", &monero_wallet_wasm_bridge::get_language);
  //emscripten::function("get_languages", &monero_wallet_wasm_bridge::get_languages);
  emscripten::function("get_public_view_key", &monero_wallet_wasm_bridge::get_public_view_key);
  emscripten::function("get_private_view_key", &monero_wallet_wasm_bridge::get_private_view_key);
  emscripten::function("get_public_spend_key", &monero_wallet_wasm_bridge::get_public_spend_key);
  emscripten::function("get_private_spend_key", &monero_wallet_wasm_bridge::get_private_spend_key);
  emscripten::function("get_address", &monero_wallet_wasm_bridge::get_address);
  emscripten::function("get_address_index", &monero_wallet_wasm_bridge::get_address_index);
  emscripten::function("get_integrated_address", &monero_wallet_wasm_bridge::get_integrated_address);
  emscripten::function("decode_integrated_address", &monero_wallet_wasm_bridge::decode_integrated_address);
  emscripten::function("get_height", &monero_wallet_wasm_bridge::get_height);
  emscripten::function("sync", &monero_wallet_wasm_bridge::sync);
  emscripten::function("get_subaddresses", &monero_wallet_wasm_bridge::get_subaddresses);
  emscripten::function("get_encrypted_text", &monero_wallet_wasm_bridge::get_encrypted_text);
}
extern "C"
{
}
