#include <stdio.h>
#include <emscripten/bind.h>
//#include <emscripten.h>

#include "monero_utils_wasm_bridge.h"

// register bindings from JS to C++ using emscripten
EMSCRIPTEN_BINDINGS(module)
{
  // register utility bindings
  emscripten::function("malloc_binary_from_json", &monero_utils_wasm_bridge::malloc_binary_from_json);
  emscripten::function("binary_to_json", &monero_utils_wasm_bridge::binary_to_json);
  emscripten::function("binary_blocks_to_json", &monero_utils_wasm_bridge::binary_blocks_to_json);
}
extern "C"
{
}
