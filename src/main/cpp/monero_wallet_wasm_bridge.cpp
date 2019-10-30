#include <iostream>
#include "monero_wallet_wasm_bridge.h"
#include "wallet/monero_wallet_dummy.h"
#include "wallet/wallet2_base.h"
#include "http_client_wasm.h"

#include <emscripten.h> // TODO: remove

using namespace std;
using namespace monero_wallet_wasm_bridge;

void my_int_func(int x)
{
    printf( "%d\n", x );
}

void monero_wallet_wasm_bridge::create_wallet_random(const string& path, const string& password, int network_type, const string& daemon_uri, const string& daemon_username, const string& daemon_password, const string& language, emscripten::val cb) {
    cout << "create_wallet_random() called!!!" << endl;
//  monero_rpc_connection daemon_connection = monero_rpc_connection(daemon_uri, daemon_username, daemon_password);
//  monero_wallet* wallet = monero_wallet::create_wallet_random(path, password, static_cast<monero_network_type>(network_type), daemon_connection, language);
//  return (int) wallet;

    http_client_wasm http_client;
    tools::wallet2_base* w2_base = new tools::wallet2_base(http_client, static_cast<cryptonote::network_type>(network_type), 1, true);
    cout << "Created wallet2_base with address: " << ((int) w2_base) << endl;
    w2_base->set_seed_language(language);
    cout << "Seed language: " << w2_base->get_seed_language() << endl;
    crypto::secret_key secret_key;

//    // simulate doing async work
//    cout << "Starting sleep" << endl;
//    emscripten_sleep(5000);
//    cout << "Done sleeping" << endl;

    w2_base->generate(path, password, secret_key, false, false);
//    std::string err;
//    if (http_client.is_connected()) w2_base->set_refresh_from_block_height(w2_base->get_daemon_blockchain_height(err));

    cout << "Calling callback" << endl;
    cb((int) w2_base);
    cout << "Done calling callback" << endl;
}


int monero_wallet_wasm_bridge::create_wallet_dummy() {
  monero_wallet_dummy* wallet = new monero_wallet_dummy();
  return (int) wallet;
}

void monero_wallet_wasm_bridge::dummy_method(int handle) {
  monero_wallet_dummy* wallet = (monero_wallet_dummy*) handle;
  wallet->dummy_method();
}
