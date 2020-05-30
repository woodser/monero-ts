# Monero C++ Library

## Table of Contents

- [Overview](#overview)
- [Sample code](#sample-code)
- [How to build this library](#how-to-build-this-library)
- [See also](#see-also)
- [License](#license)
- [Donations](#donations)

## Overview

This project is a C++ library for using Monero wallets via native bindings to [Monero Core v0.16.0.0 'Nitrogen Nebula'](https://web.getmonero.org/downloads/).

In addition, this project conforms to an [API specification](http://moneroecosystem.org/monero-java/monero-spec.pdf) intended to be intuitive and robust.

This library may be used to build Monero-related applications, such as GUIs, REST/JSON-RPC APIs, or libraries in other languages (e.g. [monero-java](https://github.com/monero-ecosystem/monero-java), [monero-javascript](https://github.com/monero-ecosystem/monero-javascript)).

- Supports RPC bindings to monero-wallet-rpc and monero-daemon-rpc.
- Supports client-side wallets in NodeJS and web apps using WebAssembly bindings to Monero Core.
- Supports multisig, view-only, and offline wallets.
- Conforms to an [API specification](https://moneroecosystem.org/monero-java/monero-spec.pdf) intended to be intuitive and robust.
- Query wallet transactions, transfers, and outputs by their many attributes.
- Receive notifications when wallets sync, send, or receive.
- Tested by over 100 JUnit test cases using JNI bindings in [monero-java](https://github.com/monero-ecosystem/monero-java).

## Sample code

This code demonstrates the API.  See the [documentation](https://woodser.github.io/monero-cpp-library/annotated.html) or [specification PDF](http://moneroecosystem.org/monero-java/monero-spec.pdf) for more details.

Note: This API might change depending on feedback, such as changing structs to classes, using pure object-oriented accessors and mutators, not using boost::optional with shared_ptrs, etc.  Feedback is welcome.

```c++
// create a wallet from a mnemonic phrase
string mnemonic = "hefty value later extra artistic firm radar yodel talent future fungal nutshell because sanity awesome nail unjustly rage unafraid cedar delayed thumbs comb custom sanity";
monero_wallet* wallet_restored = monero_wallet_core::create_wallet_from_mnemonic(
    "MyWalletRestored",                   // wallet path and name
    "supersecretpassword123",             // wallet password
    monero_network_type::STAGENET,        // network type
    mnemonic,                             // mnemonic phrase
    monero_rpc_connection(                // daemon connection
        string("http://localhost:38081"),
        string("superuser"),
        string("abctesting123")),
    380104,                               // restore height
    ""                                    // seed offset
);

// synchronize the wallet and receive progress notifications
struct : monero_wallet_listener {
  void on_sync_progress(uint64_t height, uint64_t start_height, uint64_t end_height, double percent_done, const string& message) {
    // feed a progress bar?
  }
} my_sync_listener;
wallet_restored->sync(my_sync_listener);

// start syncing the wallet continuously in the background
wallet_restored->start_syncing();

// get balance, account, subaddresses
string restored_primary = wallet_restored->get_primary_address();
uint64_t balance = wallet_restored->get_balance();    // can specify account and subaddress indices
monero_account account = wallet_restored->get_account(1, true);       // get account with subaddresses
uint64_t unlocked_account_balance = account.m_unlocked_balance.get(); // get boost::optional value

// query a transaction by hash
monero_tx_query tx_query;
tx_query.m_hash = "314a0f1375db31cea4dac4e0a51514a6282b43792269b3660166d4d2b46437ca";
shared_ptr<monero_tx_wallet> tx = wallet_restored->get_txs(tx_query)[0];
for (const shared_ptr<monero_transfer> transfer : tx->get_transfers()) {
  bool is_incoming = transfer->is_incoming().get();
  uint64_t in_amount = transfer->m_amount.get();
  int account_index = transfer->m_account_index.get();
}

// query incoming transfers to account 1
monero_transfer_query transfer_query;
transfer_query.m_is_incoming = true;
transfer_query.m_account_index = 1;
vector<shared_ptr<monero_transfer>> transfers = wallet_restored->get_transfers(transfer_query);

// query unspent outputs
monero_output_query output_query;
output_query.m_is_spent = false;
vector<shared_ptr<monero_output_wallet>> outputs = wallet_restored->get_outputs(output_query);

// create and sync a new wallet with a random mnemonic phrase
monero_wallet* wallet_random = monero_wallet_core::create_wallet_random(
    "MyWalletRandom",                     // wallet path and name
    "supersecretpassword123",             // wallet password
    monero_network_type::STAGENET,        // network type
    monero_rpc_connection(                // daemon connection
        string("http://localhost:38081"),
        string("superuser"),
        string("abctesting123")),
    "English");
wallet_random->sync();

// continuously synchronize the wallet in the background
wallet_random->start_syncing();

// get wallet info
string random_mnemonic = wallet_random->get_mnemonic();
string random_primary = wallet_random->get_primary_address();
uint64_t random_height = wallet_random->get_height();
bool random_is_synced = wallet_random->is_synced();

// receive notifications when the wallet receives funds
struct : monero_wallet_listener {
  void on_output_received(const monero_output_wallet& output) {
    cout << "Wallet received funds!" << endl;
    string tx_hash = output.m_tx->m_hash.get();
    int account_index = output.m_account_index.get();
    int subaddress_index = output.m_subaddress_index.get();
    OUTPUT_RECEIVED = true;
  }
} my_listener;
wallet_random->add_listener(my_listener);

// send funds from the restored wallet to the random wallet
monero_tx_config config;
config.m_account_index = 0;
config.m_address = wallet_random->get_address(1, 0);
config.m_amount = 50000;
config.m_relay = true;
shared_ptr<monero_tx_wallet> sent_tx = wallet_restored->create_tx(config);
bool in_pool = sent_tx->m_in_tx_pool.get();  // true

// mine with 7 threads to push the network along
int num_threads = 7;
bool is_background = false;
bool ignore_battery = false;
wallet_restored->start_mining(num_threads, is_background, ignore_battery);

// wait for the next block to be added to the chain
uint64_t next_height = wallet_random->wait_for_next_block();

// stop mining
wallet_restored->stop_mining();

// create config to send funds to multiple destinations in the random wallet
config = monero_tx_config();
config.m_account_index = 1;                // withdraw funds from this account
config.m_subaddress_indices = vector<uint32_t>();
config.m_subaddress_indices.push_back(0);
config.m_subaddress_indices.push_back(1);  // withdraw funds from these subaddresses within the account
config.m_priority = monero_tx_priority::UNIMPORTANT;  // no rush
config.m_relay = false;  // create transaction and relay to the network if true
vector<shared_ptr<monero_destination>> destinations;  // specify the recipients and their amounts
destinations.push_back(make_shared<monero_destination>(wallet_random->get_address(1, 0), 50000));
destinations.push_back(make_shared<monero_destination>(wallet_random->get_address(2, 0), 50000));
config.m_destinations = destinations;

// create the transaction, confirm with the user, and relay to the network
shared_ptr<monero_tx_wallet> created_tx = wallet_restored->create_tx(config);
uint64_t fee = created_tx->m_fee.get(); // "Are you sure you want to send ...?"
wallet_restored->relay_tx(*created_tx); // recipient receives notification within 10 seconds

// save and close the wallets
wallet_restored->close(true);
wallet_random->close(true);
```

## How to build this library

The following dependencies must be set up before running this project.

1. Set up Boost
    1. Download and extract the boost 1.72.0 source code zip from https://www.boost.org/users/download/ to ./external/boost-sdk/.
    2. `cd ./external/boost-sdk/`
    3. `./bootstrap.sh`
    4. `./b2`
    5. Copy .a files from ./external/boost-sdk/bin.v2/libs/\*/link-static/\* to ./external-libs/boost according to CMakeLists.txt.
2. Set up OpenSSL
    1. Download and extract the latest OpenSSL source code zip from https://github.com/openssl/openssl to ./external/openssl-sdk/.
    2. Build for your system.<br>
       Mac: installed through boost at /usr/local/opt/openssl/lib
    3. Copy libcrypto.a and libssl.a ./external-libs/openssl
3. Set up hidapi
    1. Download the latest hidapi source code from https://github.com/signal11/hidapi.
    2. Build hidapi for your system.<br>
       Mac requires autoreconf: `brew install automake`
    3. Copy libhidapi.a to ./external-libs/hidapi.
4. Set up libsodium
    1. Build libsodium for your system.
    2. Copy libsodium.a to ./external-libs/libsodium.<br>
       Mac: installed through homebrew at /usr/local/Cellar/libsodium/1.0.17/lib/libsodium.a
5. Set up Monero Core
    1. Initialize submodules: `git submodule update --init --recursive`
    2. `cd ./external/monero-core`
    3. `git checkout tags/v0.16.0.0`
    3. Modify CMakeLists.txt: `option(BUILD_GUI_DEPS "Build GUI dependencies." ON)`.
    4. Build twice to create libwallet_merged.a in addition to other .a libraries: `make release-static -j8`.
6. Build this project as a shared library in `./build/`: `./bin/build_libmonero_cpp.sh`.
       
This project may be compiled as part of another application or as a shared or static library.  For example, the associated [monero-java](https://github.com/monero-ecosystem/monero-java) library depends on this project as a shared library using Java JNI.

These build steps aspire to be automated further and [any help is greatly appreciated](https://github.com/woodser/monero-cpp-library/issues/1).

## See also

[API specification](http://moneroecosystem.org/monero-java/monero-spec.pdf)

[monero-java](https://github.com/monero-ecosystem/monero-java)

[monero-javascript](https://github.com/monero-ecosystem/monero-javascript)

## License

This project is licensed under MIT.

## Donations

If this library brings you value, please consider donating.

<p align="center">
	<img src="donate.png" width="115" height="115"/><br>
	<code>46FR1GKVqFNQnDiFkH7AuzbUBrGQwz2VdaXTDD4jcjRE8YkkoTYTmZ2Vohsz9gLSqkj5EM6ai9Q7sBoX4FPPYJdGKQQXPVz</code>
</p>