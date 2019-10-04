#include <stdio.h>
#include <emscripten/bind.h>

#include "monero_wallet_wasm_bridge.h"

// register bindings from C++ to JS using emscripten
EMSCRIPTEN_BINDINGS(module)
{
    //emscripten::function("new_foo", &foo_bridge::new_foo);  // TODO
}
extern "C"
{
}
