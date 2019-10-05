#include <iostream>
#include "monero_wallet_wasm_bridge.h"
#include "wallet/monero_wallet_dummy.h"

using namespace std;
using namespace monero_wallet_wasm_bridge;

int monero_wallet_wasm_bridge::new_monero_wallet_dummy() {
  monero_wallet_dummy* wallet = new monero_wallet_dummy();
  return (int) wallet;
}

void monero_wallet_wasm_bridge::dummy_method(int handle) {
  monero_wallet_dummy* wallet = (monero_wallet_dummy*) handle;
  wallet->dummy_method();
}
