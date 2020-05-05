## Monero JavaScript Library

This project is a JavaScript library for using a Monero wallet and daemon with RPC and native bindings to [Monero Core v0.15.0.5 Carbon Chameleon](https://web.getmonero.org/downloads/).

- Supports RPC bindings to monero-wallet-rpc and monero-daemon-rpc.
- Supports fully client-side wallets in NodeJS and web apps via WebAssembly bindings to Monero Core.
- Supports multisig, offline, and watch-only wallets.
- Conforms to an [API specification](https://moneroecosystem.org/monero-java/monero-spec.pdf) intended to be intuitive, robust, and suitable for long-term use.
- Query wallet transactions, transfers, and outputs by their many attributes.
- Fetch and process binary data from the daemon (e.g. raw blocks).
- Receive notifications when blocks are added to the chain and when wallets sync, send, or receive.
- Over 230 passing Mocha test cases.

<p align="center">
	<img width="85%" height="auto" src="architecture.png"/><br>
	<i>Wallet implementations are interchangeable because they conform to a common interface, <a href="https://moneroecosystem.org/monero-javascript/MoneroWallet.html">MoneroWallet.js</a>, with RPC and native WebAssembly bindings to Monero Core.</i>
</p>

### Sample Code

This code introduces the API.  See the [JSDocs](https://moneroecosystem.org/monero-javascript/MoneroWallet.html) or [API specification](https://moneroecosystem.org/monero-java/monero-spec.pdf) for more detail.

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
let walletWasm = await MoneroWalletWasm.createWalletFromMnemonic("MyWallet", "supersecretpassword123", MoneroNetworkType.STAGENET, "hefty value ...", new MoneroRpcConnection("http://localhost:38081"), 501788);

// synchronize the wallet and receive progress notifications
await walletWasm.sync(new class extends MoneroSyncListener {
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    // feed a progress bar?
  }
});

// start syncing the wallet continuously in the background
await walletWasm.startSyncing();

// receive notifications when the core wallet receives funds
await walletWasm.addListener(new class extends MoneroWalletListener {
  
  onOutputReceived(output) {
    console.log("Wallet received funds!");
    let txHash = output.getTx().getHash();
    let accountIdx = output.getAccountIndex();
    let subaddressIdx = output.getSubaddressIndex();
    TestSampleCode.CORE_OUTPUT_RECEIVED = true;
  }
});

// send funds from the RPC wallet to the core wallet
let txSet = await walletRpc.sendTx(0, await walletWasm.getPrimaryAddress(), BigInteger.parse("50000"));
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
                new MoneroDestination(await walletWasm.getAddress(1, 0), BigInteger.parse("50000")),
                new MoneroDestination(await walletWasm.getAddress(2, 0), BigInteger.parse("50000"))]);

// create the transaction, confirm with the user, and relay to the network
let createdTx = (await walletRpc.createTx(request)).getTxs()[0];
let fee = createdTx.getFee();  // "Are you sure you want to send ...?"
await walletRpc.relayTx(createdTx); // submit the transaction which will notify the core wallet

// core wallet will receive notification of incoming output after a moment
await new Promise(function(resolve) { setTimeout(resolve, 10000); });
assert(TestSampleCode.CORE_OUTPUT_RECEIVED);

// save and close the core wallet
await walletWasm.close(true);
```

### Developer Guide (wip)

[Getting Started](docs/developer_guide/getting_started.md)

### How to Use This Library

1. `cd your/npm/project` or `mkdir your/npm/project && cd your/npm/project && npm init`
2. `npm install monero-javascript`
3. Add `require("monero-javascript")` to your code

### How to Run Monero RPC

1. Download and extract the latest [Monero CLI](https://getmonero.org/downloads/) for your platform.
2. Start Monero daemon locally: `./monerod --stagenet` (or use a remote daemon).
3. Create a wallet file if one does not exist.
	- Create new / open existing: `./monero-wallet-cli --daemon-address http://localhost:38081 --stagenet`
	- Restore from mnemonic seed: `./monero-wallet-cli --daemon-address http://localhost:38081 --stagenet --restore-deterministic-wallet`
4. Start monero-wallet-rpc (requires --wallet-dir to run tests):
	
	e.g. For wallet name `test_wallet_1`, user `rpc_user`, password `abc123`, stagenet: `./monero-wallet-rpc --daemon-address http://localhost:38081 --stagenet --rpc-bind-port 38083 --rpc-login rpc_user:abc123 --wallet-dir ./`

### How to Run Mocha Tests

1. Download this project and install its dependenices.  See [How to Use This Library](#how-to-use-this-library).
2. Run monero-wallet-rpc and monero-daemon-rpc.  See [How to Run Monero RPC](#how-to-run-monero-rpc). 
3. Configure the appropriate RPC endpoints and authentication by modifying `WALLET_RPC_CONFIG` and `DAEMON_RPC_CONFIG` in [TestUtils.js](src/test/TestUtils.js).
4. Run all tests: `npm test` or run tests by their description, e.g.: `node_modules/mocha/bin/mocha src/test/TestAll --grep "Can get transactions by hash" --timeout 2000000`

### How to Build WebAssembly Source

This project uses WebAssembly to package and execute Monero Core's source code for use in a browser or other WebAssembly-supported environments.

For convenience, pre-built WebAssembly files are committed to ./dist, but these files can be built independently from source code with the following steps:

1. Install and activate emscripten:
	1. Clone the emscripten project repository: `git clone https://github.com/emscripten-core/emsdk.git`
	2. `cd emsdk`
	3. `git pull && ./emsdk install latest-upstream && ./emsdk activate latest-upstream && source ./emsdk_env.sh`
	3. `export EMSCRIPTEN=/absolute/path/to/emsdk/upstream/emscripten` (change for your system)
2. `cd /path/to/monero-javascript`
3. `./bin/build_all.sh`

### See Also

[monero-java](https://github.com/monero-ecosystem/monero-java)

[monero-cpp-library](https://github.com/woodser/monero-cpp-library)

[xmr-sample-app](https://github.com/woodser/xmr-sample-app/) - sample web app template (under development)

[monerostresstester.com](https://github.com/woodser/monerostresstester.com) - sends repeated txs to self to stress test the network (under development)

[monerowebwallet.com](https://github.com/woodser/monerowebwallet.com) - open-source, client-side web wallet (under development)

### License

This project is licensed under MIT.

### Donations

If this library brings you value, please consider donating.  Thank you!

<p align="center">
	<img src="donate.png" width="115" height="115"/><br>
	<code>46FR1GKVqFNQnDiFkH7AuzbUBrGQwz2VdaXTDD4jcjRE8YkkoTYTmZ2Vohsz9gLSqkj5EM6ai9Q7sBoX4FPPYJdGKQQXPVz</code>
</p>
