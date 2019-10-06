#include <stdio.h>
#include <emscripten/bind.h>

#include "monero_wallet_wasm_bridge.h"

// register bindings from C++ to JS using emscripten
EMSCRIPTEN_BINDINGS(module)
{
    emscripten::function("create_wallet_random", &monero_wallet_wasm_bridge::create_wallet_random);
    emscripten::function("create_wallet_dummy", &monero_wallet_wasm_bridge::create_wallet_dummy);
    emscripten::function("dummy_method", &monero_wallet_wasm_bridge::dummy_method);
}
extern "C"
{
}
