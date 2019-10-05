/**
 * Provides a bridge from WebAssembly to the Monero wallet.
 */
#ifndef monero_wallet_wasm_bridge_h
#define monero_wallet_wasm_bridge_h

#include <string>

using namespace std;

namespace monero_wallet_wasm_bridge
{
  int new_monero_wallet_dummy();
  void dummy_method(int handle);
}

#endif /* monero_wallet_wasm_bridge_h */
