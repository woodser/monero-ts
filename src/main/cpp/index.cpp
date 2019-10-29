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
  emscripten::function("create_wallet_random", &monero_wallet_wasm_bridge::create_wallet_random);
  emscripten::function("create_wallet_dummy", &monero_wallet_wasm_bridge::create_wallet_dummy);
  emscripten::function("dummy_method", &monero_wallet_wasm_bridge::dummy_method);
}
extern "C"
{
}
