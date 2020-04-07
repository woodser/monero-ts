**Compatible with [Monero Core v0.15.0.1](https://web.getmonero.org/downloads/) Carbon Chameleon**

# Monero JavaScript Library

This project is a library for using a Monero wallet and daemon in JavaScript using RPC or WebAssembly bindings to [monero-project](https://github.com/monero-project/monero).

In addition, this project conforms to an [API specification](http://moneroecosystem.org/monero-java/monero-spec.pdf) intended to be intuitive, robust, and suitable for long-term use in the Monero project.

## Main Features

- Build NodeJS and [web applications](https://github.com/woodser/xmr-sample-app) using Monero
- Manage a Monero wallet using RPC and WebAssembly bindings to monero-project
- Manage a Monero daemon using RPC bindings to monero-project
- Cohesive APIs with focus on ease-of-use
- Fetch and process binary data from the daemon (e.g. raw blocks)
- Query wallet transactions, transfers, and outputs by their attributes
- Receive notifications when blocks are added to the chain
- Full multisig support
- Over 200 passing Mocha test cases

## Sample Code

This code demonstrates the API.  See the [jsdoc](https://moneroecosystem.org/monero-javascript/), [specification PDF](http://moneroecosystem.org/monero-java/monero-spec.pdf), or [Mocha tests](src/test/) for more details.

```js
// import library
require("monero-javascript");

// connect to a daemon
let daemon = new MoneroDaemonRpc("http://localhost:38081");
let height = await daemon.getHeight();           // 1523651
let feeEstimate = await daemon.getFeeEstimate(); // 1014313512

// get transactions in the pool
let txsInPool = await daemon.getTxPool();
for (let tx of txsInPool) {
  let hash = tx.getHash();
  let fee = tx.getFee();
  let isDoubleSpendSeen = tx.isDoubleSpendSeen();
}

// get last 100 blocks as a binary request
let blocks = await daemon.getBlocksByRange(height - 100, height - 1);
for (let block of blocks) {
  let numTxs = block.getTxs().length;
}

// connect to a monero-wallet-rpc endpoint with authentication
let walletRpc = new MoneroWalletRpc("http://localhost:38083", "rpc_user", "abc123");

// open a wallet on the server
await walletRpc.openWallet("test_wallet_1", "supersecretpassword123");
let primaryAddress = await walletRpc.getPrimaryAddress(); // 59aZULsUF3YNSKGiHz4J...
let balance = await walletRpc.getBalance();               // 533648366742
let subaddress = await walletRpc.getSubaddress(1, 0);
let subaddressBalance = subaddress.getBalance();

// query a transaction by hash
let tx = await walletRpc.getTx("32088012e68be1c090dc022f7852ca4d7c23066241649cdfaeb14ec1fd5a10f8");
let txHeight = tx.getHeight();
let incomingTransfers = tx.getIncomingTransfers();
let destinations = tx.getOutgoingTransfer().getDestinations();

// query incoming transfers to account 1
let transferQuery = new MoneroTransferQuery().setIsIncoming(true).setAccountIndex(1);
let transfers = await walletRpc.getTransfers(transferQuery);

// query unspent outputs
let outputQuery = new MoneroOutputQuery().setIsSpent(false);
let outputs = await walletRpc.getOutputs(outputQuery);

// create a wallet from a mnemonic phrase using WebAssembly bindings to monero-project
let walletCore = await MoneroWalletCore.createWalletFromMnemonic("MyWallet", "supersecretpassword123", MoneroNetworkType.STAGENET, "hefty value ...", new MoneroRpcConnection("http://localhost:38081"), 501788);

// synchronize the wallet and receive progress notifications
await walletCore.sync(new class extends MoneroSyncListener {
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    // feed a progress bar?
  }
});

// start syncing the wallet continuously in the background
await walletCore.startSyncing();

// receive notifications when the core wallet receives funds
await walletCore.addListener(new class extends MoneroWalletListener {
  
  onOutputReceived(output) {
    console.log("Wallet received funds!");
    let txHash = output.getTx().getHash();
    let accountIdx = output.getAccountIndex();
    let subaddressIdx = output.getSubaddressIndex();
    TestSampleCode.CORE_OUTPUT_RECEIVED = true;
  }
});

// send funds from the RPC wallet to the core wallet
let txSet = await walletRpc.send(0, await walletCore.getPrimaryAddress(), BigInteger.parse("50000"));
let sentTx = txSet.getTxs()[0];  // send methods return tx set(s) which contain sent txs unless further steps needed in a multisig or watch-only wallet
assert(sentTx.inTxPool());

// mine with 7 threads to push the network along
let numThreads = 7;
let isBackground = false;
let ignoreBattery = false;
await walletRpc.startMining(numThreads, isBackground, ignoreBattery);

// wait for the next block to be added to the chain
let nextBlockHeader = await daemon.getNextBlockHeader();
let nextNumTxs = nextBlockHeader.getNumTxs();

// stop mining
await walletRpc.stopMining();

// the transaction is (probably) confirmed
await new Promise(function(resolve) { setTimeout(resolve, 10000); });  // wait 10s for auto refresh
let isConfirmed = (await walletRpc.getTx(sentTx.getHash())).isConfirmed();

// create a request to send funds from the RPC wallet to multiple destinations in the core wallet
let request = new MoneroSendRequest()
        .setAccountIndex(1)                           // send from account 1
        .setSubaddressIndices([0, 1])                 // send from subaddresses in account 1
        .setPriority(MoneroSendPriority.UNIMPORTANT)  // no rush
        .setDestinations([
                new MoneroDestination(await walletCore.getAddress(1, 0), BigInteger.parse("50000")),
                new MoneroDestination(await walletCore.getAddress(2, 0), BigInteger.parse("50000"))]);

// create the transaction, confirm with the user, and relay to the network
let createdTx = (await walletRpc.createTx(request)).getTxs()[0];
let fee = createdTx.getFee();  // "Are you sure you want to send ...?"
await walletRpc.relayTx(createdTx); // submit the transaction which will notify the core wallet

// core wallet will receive notification of incoming output after a moment
await new Promise(function(resolve) { setTimeout(resolve, 10000); });
assert(TestSampleCode.CORE_OUTPUT_RECEIVED);

// save and close the core wallet
await walletCore.close(true);
```

## How to Run This Library

`npm install monero-javascript`

Or

1. Clone the project repository: `git clone https://github.com/monero-ecosystem/monero-javascript.git`
2. cd `monero-javascript`
3. Install dependencies using Node Package Manager: `npm install`

## How to Run Monero RPC

1. Download and extract the latest [Monero CLI](https://getmonero.org/downloads/) for your platform.
2. Start Monero daemon locally: `./monerod --stagenet` (or use a remote daemon).
3. Create a wallet file if one does not exist.
	- Create new / open existing: `./monero-wallet-cli --daemon-address http://localhost:38081 --stagenet`
	- Restore from mnemonic seed: `./monero-wallet-cli --daemon-address http://localhost:38081 --stagenet --restore-deterministic-wallet`
4. Start monero-wallet-rpc (requires --wallet-dir to run tests):
	
	e.g. For wallet name `test_wallet_1`, user `rpc_user`, password `abc123`, stagenet: `./monero-wallet-rpc --daemon-address http://localhost:38081 --stagenet --rpc-bind-port 38083 --rpc-login rpc_user:abc123 --wallet-dir ./`

## How to Run Mocha Tests

1. Download this project and install its dependenices.  See [How to Run This Library](#how-to-run-this-library).
2. Run monero-wallet-rpc and monero-daemon-rpc.  See [How to Run Monero RPC](#how-to-run-monero-rpc). 
3. Configure the appropriate RPC endpoints and authentication by modifying `WALLET_RPC_CONFIG` and `DAEMON_RPC_CONFIG` in [TestUtils.js](src/test/TestUtils.js).
4. Run all tests: `npm test` or run tests by their description, e.g.: `node_modules/mocha/bin/mocha src/test/TestAll --grep "Can get transactions by hash" --timeout 2000000`

## How to Build WebAssembly Files from Source

This project uses WebAssembly to package and execute monero-project's source code for use in a browser or other WebAssembly-supported environment.

For convenience, pre-built WebAssembly files for this project's source code are committed to ./dist, but these files can be built independently from source code with the following steps:

1. Install and activate emscripten:
	1. Clone the emscripten project repository: `git clone https://github.com/emscripten-core/emsdk.git`
	2. `cd emsdk`
	3. `git pull`
	4. `./emsdk install latest-upstream`
	5. `./emsdk activate latest-upstream`
	6. `source ./emsdk_env.sh`
	7. `export EMSCRIPTEN=/absolute/path/to/emsdk/upstream/emscripten` (set for your system)
2. `cd /path/to/monero-javascript`
3. Update submodules: `./bin/update_submodules.sh`
4. Checkout and build a branch of monero-project which has [minor modifications](https://github.com/monero-project/monero/compare/master...woodser:wasm_modifications) for compatibility with WebAssembly:
	1. `cd ./external/monero-cpp-library/external/monero-core`
	2. `git submodule update --init --force`
	3. `git fetch`
	4. `git checkout wasm_modifications`
	5. `make release-static -j8` (builds translations directory even if build does not finish)
	6. `cd ../../../../`
5. Checkout branch of monero-cpp-library with modifications for WebAssembly: `git --git-dir ./external/monero-cpp-library/.git checkout wasm_modifications`
6. Download and build Boost using emscripten: `./bin/build_boost_emscripten.h`
7. Download and build OpenSSL using emscripten: `./bin/build_openssl_emscripten.sh`
8. Build WebAssembly files to ./dist/: `./bin/build_dist.sh`

## See Also

[Sample web application using monero-javascript](https://github.com/woodser/xmr-sample-app)

[API specification](http://moneroecosystem.org/monero-java/monero-spec.pdf)

[monero-java](https://github.com/monero-ecosystem/monero-java)

[monero-cpp-library](https://github.com/woodser/monero-cpp-library)

## License

This project is licensed under MIT.

## Donations

If you get value from this library, please consider donating.  Thank you!

<p align="center">
	<img src="donate.png" width="115" height="115"/>
</p>

`46FR1GKVqFNQnDiFkH7AuzbUBrGQwz2VdaXTDD4jcjRE8YkkoTYTmZ2Vohsz9gLSqkj5EM6ai9Q7sBoX4FPPYJdGKQQXPVz`