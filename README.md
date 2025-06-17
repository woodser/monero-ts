# Monero TypeScript Library

A TypeScript library for creating Monero applications using RPC and WebAssembly bindings to [monero v0.18.4.0 'Fluorine Fermi'](https://github.com/monero-project/monero/tree/v0.18.4.0).

* Supports client-side wallets in Node.js and the browser using WebAssembly.
* Supports wallet and daemon RPC clients.
* Supports multisig, view-only, and offline wallets.
* Wallet types are interchangeable by conforming to a [common interface](https://woodser.github.io/monero-ts/typedocs/classes/MoneroWallet.html).
* Uses a clearly defined [data model and API specification](https://woodser.github.io/monero-java/monero-spec.pdf) intended to be intuitive and robust.
* [Query wallet transactions, transfers, and outputs](docs/developer_guide/query_data_model.md) by their properties.
* Fetch and process binary data from the daemon (e.g. raw blocks).
* Receive notifications when blocks are added to the chain or when wallets sync, send, or receive.
* Over 300 passing Mocha tests.

## Architecture

<p align="center">
	<img width="85%" height="auto" src="https://raw.githubusercontent.com/woodser/monero-ts/master/docs/img/architecture.png"/><br>
	<i>Build browser or Node.js applications using RPC or WebAssembly bindings to <a href="https://github.com/monero-project/monero">monero-project/monero</a>.  Wallet implementations are interchangeable by conforming to a common interface, <a href="https://woodser.github.io/monero-ts/typedocs/classes/MoneroWallet.html">MoneroWallet.ts</a>.</i>
</p>

## Sample code

```typescript
// import monero-ts (or import types individually)
import moneroTs from "monero-ts";

// connect to daemon
let daemon = await moneroTs.connectToDaemonRpc("http://localhost:28081");
let height = await daemon.getHeight();        // 1523651
let txsInPool = await daemon.getTxPool();     // get transactions in the pool

// create wallet from mnemonic phrase using WebAssembly bindings to monero-project
let walletFull = await moneroTs.createWalletFull({
  path: "sample_wallet_full",
  password: "supersecretpassword123",
  networkType: moneroTs.MoneroNetworkType.TESTNET,
  seed: "hefty value scenic...",
  restoreHeight: 573936,
  server: { // provide url or MoneroRpcConnection
    uri: "http://localhost:28081",
    username: "superuser",
    password: "abctesting123"
  }
});

// synchronize with progress notifications
await walletFull.sync(new class extends moneroTs.MoneroWalletListener {
  async onSyncProgress(height: number, startHeight: number, endHeight: number, percentDone: number, message: string) {
    // feed a progress bar?
  }
});

// synchronize in the background every 5 seconds
await walletFull.startSyncing(5000);

// receive notifications when funds are received, confirmed, and unlocked
let fundsReceived = false;
await walletFull.addListener(new class extends moneroTs.MoneroWalletListener {
  async onOutputReceived(output: moneroTs.MoneroOutputWallet) {
    let amount = output.getAmount();
    let txHash = output.getTx().getHash();
    let isConfirmed = output.getTx().getIsConfirmed();
    let isLocked = output.getTx().getIsLocked();
    fundsReceived = true;
  }
});

// connect to wallet RPC and open wallet
let walletRpc = await moneroTs.connectToWalletRpc("http://localhost:28084", "rpc_user", "abc123");
await walletRpc.openWallet("sample_wallet_rpc", "supersecretpassword123");
let primaryAddress = await walletRpc.getPrimaryAddress(); // 555zgduFhmKd2o8rPUz...
let balance = await walletRpc.getBalance();   // 533648366742
let txs = await walletRpc.getTxs();           // get transactions containing transfers to/from the wallet

// send funds from RPC wallet to WebAssembly wallet
let createdTx = await walletRpc.createTx({
  accountIndex: 0,
  address: await walletFull.getAddress(1, 0),
  amount: 250000000000n, // send 0.25 XMR (denominated in atomic units)
  relay: false // create transaction and relay to the network if true
});
let fee = createdTx.getFee(); // "Are you sure you want to send... ?"
await walletRpc.relayTx(createdTx); // relay the transaction

// recipient receives unconfirmed funds within 5 seconds
await new Promise(function(resolve) { setTimeout(resolve, 5000); });
assert(fundsReceived);

// save and close WebAssembly wallet
await walletFull.close(true);
```

## Documentation

* [TypeDocs](https://woodser.github.io/monero-ts/typedocs/)
* [API and model overview with visual diagrams](https://woodser.github.io/monero-java/monero-spec.pdf)
* [Creating wallets](docs/developer_guide/creating_wallets.md)
* [The data model: blocks, transactions, transfers, and outputs](docs/developer_guide/data_model.md)
* [Getting transactions, transfers, and outputs](docs/developer_guide/query_data_model.md)
* [Sending funds](docs/developer_guide/sending_funds.md)
* [Multisig wallets](docs/developer_guide/multisig_wallets.md)
* [View-only and offline wallets](docs/developer_guide/view_only_offline.md)
* [Connection manager](docs/developer_guide/connection_manager.md)
* [HTTPS and self-signed certificates](./docs/developer_guide/https_and_self_signed_certificates.md)
* [Mocha tests](src/test)
* [Installing prerequisites](docs/developer_guide/installing_prerequisites.md)
* [Getting started part 1: creating a Node.js application](docs/developer_guide/getting_started_p1.md)
* [Getting started part 2: creating a web application](docs/developer_guide/getting_started_p2.md)

## Sample projects

* [Sample Node.js app](https://github.com/woodser/xmr-sample-node)
* [Sample React app](https://github.com/woodser/xmr-sample-react)
* [Sample Next.js app](https://github.com/woodser/xmr-sample-next)
* [Sample Vite app](https://github.com/woodser/xmr-sample-vite)
* [Sample Webpack app](https://github.com/woodser/xmr-sample-webpack)
* [Sample Deno app](https://github.com/woodser/xmr-sample-deno)

## Related projects

* [monero-cpp](https://github.com/woodser/monero-cpp) - C++ library counterpart
* [monero-java](https://github.com/woodser/monero-java) - Java library counterpart
* [haveno-ts](https://github.com/haveno-dex/haveno-ts) - used for testing Haveno and its TypeScript library

## Using monero-ts in your project

1. `cd your_project` or `mkdir your_project && cd your_project && npm init`
2. `npm install monero-ts`
3. Add `import moneroTs from "monero-ts"` in your application code (or import types individually).

#### Running in Node.js

Node 20 LTS is recommended. Alternatively, Node 16 and 18 LTS work using the `--experimental-wasm-threads` flag.

#### Building a browser application
1. Bundle your application code for a browser. See [xmr-sample-webpack](https://github.com/woodser/xmr-sample-webpack) for an example project using Webpack.
2. Copy assets from ./dist to your web app's build directory.

#### Using RPC servers:
1. Download and install [Monero CLI](https://web.getmonero.org/downloads/).
2. Start monerod, e.g.: `./monerod --stagenet` (or use a remote daemon).
3. Start monero-wallet-rpc, e.g.: `./monero-wallet-rpc --daemon-address http://localhost:38081 --stagenet --rpc-bind-port 38084 --rpc-login rpc_user:abc123 --wallet-dir ./`

## Building WebAssembly binaries from source

This project uses WebAssembly to package and execute Monero's source code for a browser or other WebAssembly-supported environment.

Compiled WebAssembly binaries are committed to ./dist for convenience, but these files can be built independently from source code:

1. Install and activate emscripten.
	1. Clone emscripten repository: `git clone https://github.com/emscripten-core/emsdk.git`
	2. `cd emsdk`
	3. `git pull && ./emsdk install 3.1.66 && ./emsdk activate 3.1.66 && source ./emsdk_env.sh`
	4. `export EMSCRIPTEN=path/to/emsdk/upstream/emscripten` (change for your system)
2. Clone monero-ts repository: `git clone --recursive https://github.com/woodser/monero-ts.git`
3. `cd monero-ts`
4. `./bin/update_submodules.sh`
5. Modify ./external/monero-cpp/external/monero-project/src/crypto/wallet/CMakeLists.txt from `set(MONERO_WALLET_CRYPTO_LIBRARY "auto" ...` to `set(MONERO_WALLET_CRYPTO_LIBRARY "cn" ...`.
6. Build the monero-cpp submodule (located at ./external/monero-cpp) by following [instructions](https://github.com/woodser/monero-cpp#using-monero-cpp-in-your-project) for your system. This will ensure all dependencies are installed. Be sure to install unbound 1.19.0 to your home directory (`~/unbound-1.19.0`).
7. `./bin/build_all.sh` (install [monero-project dependencies](https://github.com/monero-project/monero#dependencies) as needed for your system)

## Running tests

1. Clone the project repository: `git clone https://github.com/woodser/monero-ts.git`
2. `cd monero-ts`
3. Start RPC servers:
	1. Download and install [Monero CLI](https://web.getmonero.org/downloads/).
	2. Start monerod, e.g.: `./monerod --testnet` (or use a remote daemon).
	3. Start monero-wallet-rpc, e.g.: `./monero-wallet-rpc --daemon-address http://localhost:38081 --testnet --rpc-bind-port 28084 --rpc-login rpc_user:abc123 --wallet-dir ./`
4. Configure the appropriate RPC endpoints, authentication, and other settings in [TestUtils.ts](src/test/utils/TestUtils.ts) (e.g. `WALLET_RPC_CONFIG` and `DAEMON_RPC_CONFIG`).

#### Running tests in Node.js

* Run all tests: `npm test`
* Run tests by their description, e.g.: `npm run test -- --grep "Can get transactions"`

#### Running tests in a browser

1. Start monero-wallet-rpc servers used by tests: `./bin/start_wallet_rpc_test_servers.sh`
2. In another terminal, build browser tests: `./bin/build_browser_tests.sh`
3. Access http://localhost:8080/tests.html in a browser to run all tests

## License

This project is licensed under MIT.

## Donations

Please consider donating to support the development of this project. 🙏

<p align="center">
	<img src="donate.png" width="115" height="115"/><br>
	<code>46FR1GKVqFNQnDiFkH7AuzbUBrGQwz2VdaXTDD4jcjRE8YkkoTYTmZ2Vohsz9gLSqkj5EM6ai9Q7sBoX4FPPYJdGKQQXPVz</code>
</p>
