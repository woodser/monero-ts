# Monero C++ Library

This project is a library for working with Monero wallets in C++ by wrapping [Monero Core's](https://github.com/monero-project/monero) C++ wallet, [wallet2](https://github.com/monero-project/monero/blob/master/src/wallet/wallet2.h).

In addition, this project conforms to an [API specification](https://github.com/monero-ecosystem/monero-java/blob/master/monero-spec.pdf) intended to be intuitive, robust, and for long-term use in the Monero project.

This library may be used to build Monero-related applications, such as GUIs, libraries in other languages (e.g. [monero-java](https://github.com/monero-ecosystem/monero-java-rpc)), or a compliant REST/JSON-RPC API.

## Main Features

- Manage Monero wallets which connect to a daemon
- Cohesive APIs and models with rigorous focus on ease-of-use
- Query wallet transactions, transfers, and outputs by their many attributes
- Be notified when blocks are added to the chain, as the wallet synchronizes, or when the wallet sends or receives funds

## Sample Code

This code introduces the API.  See the [specification PDF](https://github.com/monero-ecosystem/monero-java/blob/master/monero-spec.pdf) for full details.

```c++
// create a wallet from a mnemonic phrase
string mnemonic = "hefty value later extra artistic firm radar yodel talent future fungal nutshell because sanity awesome nail unjustly rage unafraid cedar delayed thumbs comb custom sanity";
monero_wallet* wallet_restored = monero_wallet::create_wallet_from_mnemonic(
    "MyWalletRestored",                               // wallet path and name
    "supersecretpassword123",                         // wallet password
    monero_network_type::STAGENET,                    // network type
    mnemonic,                                         // mnemonic phrase
    monero_rpc_connection("http://localhost:38081"),  // daemon connection
    380104                                            // restore height
);

// sync the wallet
wallet_restored->sync();          // one time synchronous sync
wallet_restored->start_syncing(); // continuously sync as an asynchronous thread in the background

// get balance, account, subaddresses
string primary_address = wallet_restored->get_primary_address();
uint64_t balance = wallet_restored->get_balance();    // can specify account and subaddress indices
monero_account account = wallet_restored->get_account(1, true);       // get account with subaddresses
uint64_t unlocked_account_balance = account.m_unlocked_balance.get(); // get boost::optional value

// query a transaction by id
monero_tx_query tx_query;
tx_query.m_id = "3276252c5a545b90c8e147fcde45d3e1917726470a8f7d4c8977b527a44dfd15";
shared_ptr<monero_tx_wallet> tx = wallet_restored->get_txs(tx_query)[0];
for (const shared_ptr<monero_incoming_transfer> in_transfer : tx->m_incoming_transfers) {
  uint64_t in_amount = in_transfer->m_amount.get();
  int account_index = in_transfer->m_account_index.get();
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

// create a new wallet with a random mnemonic phrase
monero_wallet* wallet_random = monero_wallet::create_wallet_random(
    "MyWalletRandom",                                 // wallet path and name
    "supersecretpassword123",                         // wallet password
    monero_network_type::STAGENET,                    // network type
    monero_rpc_connection("http://localhost:38081"),  // daemon connection
    "English"
);

// continuously synchronize the wallet
wallet_random->start_syncing();

// get wallet info
string random_mnemonic = wallet_random->get_mnemonic();
string address = wallet_random->get_primary_address();
uint64_t height = wallet_random->get_height();
bool is_synced = wallet_random->is_synced();

// be notified when the wallet receives funds
struct : monero_wallet_listener {
  void on_output_received(const monero_output_wallet& output) {
    cout << "Wallet received funds!" << endl;
    int account_index = output.m_account_index.get();
    int subaddress_index = output.m_subaddress_index.get();
    shared_ptr<monero_key_image> key_image = output.m_key_image.get();
  }
} my_listener;
wallet_random->set_listener(my_listener);

// send funds from the restored wallet to the random wallet
shared_ptr<monero_tx_wallet> sent_tx = wallet_restored->send(0, wallet_random->get_address(1, 0), 50000);
bool in_pool = sent_tx->m_in_tx_pool.get();  // true

// create a request to send funds to multiple destinations in the random wallet
monero_send_request send_request = monero_send_request();
send_request.m_account_index = 1;                // withdraw funds from this account
send_request.m_subaddress_indices = vector<uint32_t>();
send_request.m_subaddress_indices.push_back(0);
send_request.m_subaddress_indices.push_back(1);  // withdraw funds from these subaddresses within the account
send_request.m_priority = monero_send_priority::UNIMPORTANT;  // no rush
vector<shared_ptr<monero_destination>> destinations;  // specify the recipients and their amounts
destinations.push_back(make_shared<monero_destination>(wallet_random->get_address(1, 0), 50000));
destinations.push_back(make_shared<monero_destination>(wallet_random->get_address(2, 0), 50000));
send_request.m_destinations = destinations;

// create the transaction, confirm with the user, and relay to the network
shared_ptr<monero_tx_wallet> created_tx = wallet_restored->create_tx(send_request);
uint64_t fee = created_tx->m_fee.get(); // "Are you sure you want to send ...?"
wallet_restored->relay_tx(*created_tx); // submit the transaction to the Monero network which will notify the recipient wallet
```

## Building a Dynamic / Shared Library

The source code in this project may be built as a dynamic or shared library for use on a target platform (e.g. Linux, Mac, Windows, etc).  For example, the associated [Java library](https://github.com/monero-ecosystem/monero-java-rpc) depends on a dynamic library built from this project to support a wallet using Java JNI.

### Build Steps

1. Setup Boost
    1. Download and extract the boost 1.69.0 source code zip from https://www.boost.org/users/download/ to ./external/boost-sdk/.
    2. `cd ./external/boost-sdk/`
    3. `./bootstraph.sh`
    4. `./b2`
    5. Copy .a files from ./external/boost-sdk/bin.v2/libs/\*/link-static/\* to ./external-libs/boost according to CMakeLists.txt.
2. Setup OpenSSL
    1. Download and extract the latest OpenSSL source code zip from https://github.com/openssl/openssl to ./external/openssl-sdk/.
    2. Build for your system.<br>
       Mac: installed through boost at /usr/local/opt/openssl/lib
    3. Copy libcrypto.a and libssl.a ./external-libs/openssl.
3. Setup Monero Core
    1. Initialize submodules: `git submodule update --init --recursive`
    2. cd ./submodules/monero-core
    3. Modify CMakeLists.txt: `option(BUILD_GUI_DEPS "Build GUI dependencies." ON)`.
    4. Build twice to create libwallet_merged.a in addition to other .a libraries: `make release-static -j8`.
    5. Copy .a files from ./submodules/monero-core/build/release/* to ./external-libs/monero-core according to CMakeLists.txt.
4. Setup hidapi
    1. Download the latest hidapi source code from https://github.com/signal11/hidapi.
    2. Build hidapi for your system.<br>
       Mac requires autoreconf: `brew install automake`
    3. Copy libhidapi.a to ./external-libs/hidapi.
5. Setup libsodium
    1. Build libsodium for your system.
    2. Copy libsodium.a to ./external-libs/libsodium.<br>
       Mac: installed through homebrew at /usr/local/Cellar/libsodium/1.0.17/lib/libsodium.a
6. Build libmonero-cpp.dylib to ./build: `./bin/build-libmonero-cpp.sh`.

These build steps aspire to be automated further.

## See Also

These libraries conform to the same [API specification](https://github.com/monero-ecosystem/monero-java/blob/master/monero-spec.pdf).

[Java reference implementation](https://github.com/monero-ecosystem/monero-java-rpc)

[JavaScript reference implementation](https://github.com/monero-ecosystem/monero-javascript)

## License

This project is licensed under MIT.

## Donate

Donations are gratefully accepted.  Thank you for your support!

<p align="center">
	<img src="donate.png" width="150" height="150"/>
</p>

`46FR1GKVqFNQnDiFkH7AuzbUBrGQwz2VdaXTDD4jcjRE8YkkoTYTmZ2Vohsz9gLSqkj5EM6ai9Q7sBoX4FPPYJdGKQQXPVz`