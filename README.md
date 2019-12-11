**Compatible with [Monero Core v0.15.0.1](https://web.getmonero.org/downloads/) Carbon Chameleon**

# Monero JavaScript Library

This project is a library for using a Monero wallet and daemon in JavaScript / NodeJS using RPC bindings to [monero-wallet-rpc](https://getmonero.org/resources/developer-guides/wallet-rpc.html) and [monero-daemon-rpc](https://getmonero.org/resources/developer-guides/daemon-rpc.html).

In addition, this project conforms to an [API specification](http://moneroecosystem.org/monero-java/monero-spec.pdf) intended to be intuitive, robust, and suitable for long-term use in the Monero project.

## Main Features

- Manage a Monero wallet and daemon using RPC
- Cohesive APIs with rigorous focus on ease-of-use
- Fetch and process binary data from the daemon (e.g. raw blocks)
- Query wallet transactions, transfers, and outputs by their many attributes
- Be notified when blocks are added to the chain
- Build web applications which use a Monero wallet and daemon
- Generate wallet keys offline and locally using WebAssembly bindings to core utilities
- Full multisig support
- Over 150 passing Mocha test cases

## Sample Code

This code introduces the API.  See the [jsdoc](https://moneroecosystem.org/monero-javascript/), [specification PDF](http://moneroecosystem.org/monero-java/monero-spec.pdf), or [Mocha tests](src/test/) for more details.

```js
// import daemon and rpc wallet
const MoneroDaemonRpc = require("src/main/daemon/MoneroDaemonRpc");
const MoneroWalletRpc = require("src/main/wallet/MoneroWalletRpc");

// connect to a daemon
let daemon = new MoneroDaemonRpc("http://localhost:38081");
let height = await daemon.getHeight();           // 1523651
let feeEstimate = await daemon.getFeeEstimate(); // 1014313512

// get transactions in the pool
let txsInPool = await daemon.getTxPool();
for (let tx of txsInPool) {
  let id = tx.getId();
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

// query a transaction by id
let tx = await walletRpc.getTx("314a0f1375db31cea4dac4e0a51514a6282b43792269b3660166d4d2b46437ca");
let txHeight = tx.getHeight();
let incomingTransfers = tx.getIncomingTransfers();
let destinations = tx.getOutgoingTransfer().getDestinations();

// query incoming transfers to account 1
let transferQuery = new MoneroTransferQuery().setIsIncoming(true).setAccountIndex(1);
let transfers = await walletRpc.getTransfers(transferQuery);

// query unspent outputs
let outputQuery = new MoneroOutputQuery().setIsSpent(false);
let outputs = await walletRpc.getOutputs(outputQuery);

// send funds from the RPC wallet
let txSet = await walletRpc.send(0, "79fgaPL8we44uPA5SBzB7ABvxR1CrU6gteRfny1eXc2RVQk7Jhk5oR5YQnQZuorP3kEVXxewi2CG5CfUBfmRqTvy49UvYkG", new BigInteger("50000"));
let sentTx = txSet.getTxs()[0];  // send methods return tx set(s) which contain sent txs unless further steps needed in a multisig or watch-only wallet
assert(sentTx.inTxPool());

// create a request to send funds from the RPC wallet to multiple destinations
let request = new MoneroSendRequest()
        .setAccountIndex(1)                           // send from account 1
        .setSubaddressIndices([0, 1])                 // send from subaddreses in account 1
        .setPriority(MoneroSendPriority.UNIMPORTANT)  // no rush
        .setDestinations([
                new MoneroDestination("79LS7Vq214d6tXRdAoosz9Qifbg2qTNrZfWziwLZc8ih3GRjxN1dWZNTYmr7HAmVKLd5NsCfJRucJH4xPF326HdeVhngHyj", new BigInteger("50000")),
                new MoneroDestination("74YpXA1GvZeJHQtdRCByB2PzEfGzQSpniDr6yier8UrKhXU4YAp8QVDFSKd4XAMsj4HYcE9ibW3JzKVSXEDoE4xkMSFvHAe", new BigInteger("50000"))]);

// create the transaction, confirm with the user, and relay to the network
let createdTx = (await walletRpc.createTx(request)).getTxs()[0];
let fee = createdTx.getFee();       // "Are you sure you want to send ...?"
await walletRpc.relayTx(createdTx); // submit the transaction which will notify the JNI wallet

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
await new Promise(function(resolve) { setTimeout(resolve, 10000); }); // wait 10s for auto refresh
let isConfirmed = (await walletRpc.getTx(createdTx.getId())).isConfirmed();
```

## How to Run This Library

`npm install monero-javascript`

Or

1. Clone this repository: `git clone https://github.com/monero-ecosystem/monero-javascript.git`
2. cd `monero-javascript`
2. Install dependencies using Node Package Manager: `npm install`

You are now ready to use this library with [monero-daemon-rpc](https://getmonero.org/resources/developer-guides/daemon-rpc.html) and [monero-wallet-rpc](https://getmonero.org/resources/developer-guides/wallet-rpc.html) endpoints.

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
4. Run all tests: `npm test` or run tests by their description, e.g.: `node_modules/mocha/bin/mocha src/test/TestAll --grep "Can get transactions by id" --timeout 2000000`

## How to Build WebAssembly file from Source

This project uses WebAssembly to package and execute Monero Core source code.

A pre-built WebAssembly file (monero_cpp_library.wasm) is committed to ./build/ for convenience, but this file can be built independently from source code.

To build the WebAssembly file from source:

1. Install and activate emscripten:
	1. Download emscripten to a folder: `git clone https://github.com/emscripten-core/emsdk.git`
	2. `cd emsdk`
	3. `git pull`
	4. `./emsdk install latest`
	5. `./emsdk activate latest`
	6. `source ./emsdk_env.sh`
2. Clone this repository: `git clone --recurse-submodules https://github.com/monero-ecosystem/monero-javascript.git`
3. Build Boost using emscripten: `./bin/build-boost-emscripten.h`
4. Build WebAssembly file to ./build/monero_cpp_library.wasm: `./bin/build-emcpp.sh`


If you want to process binary data or use a Monero wallet using WebAssembly instead of RPC, a dynamic library must be built for your specific platform for this Java library to use.  This project uses a [C++ counterpart library](https://github.com/woodser/monero-cpp-library) to support JNI, which is included as a submodule in ./external/monero-cpp-library.

1. `export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_66.jdk/Contents/Home/` (change as appropriate)
2. `cd <project_root>`
3. `./bin/build-libmonero-java.sh
4. Run TestMoneroCppUtils.java JUnit tests to verify the dynamic library is working with Java JNI

## Sample Web Application

A [sample web application](https://github.com/woodser/xmr-sample-app) demonstrates integration of this library in a web browser.

## See Also

[Sample web application](https://github.com/woodser/xmr-sample-app)

[Java reference implementation](https://github.com/monero-ecosystem/monero-java)

[C++ reference implementation](https://github.com/woodser/monero-cpp-library)

## License

This project is licensed under MIT.

## Donate

Donations are gratefully accepted.  Thank you for your support!

<p align="center">
	<img src="donate.png" width="115" height="115"/>
</p>

`46FR1GKVqFNQnDiFkH7AuzbUBrGQwz2VdaXTDD4jcjRE8YkkoTYTmZ2Vohsz9gLSqkj5EM6ai9Q7sBoX4FPPYJdGKQQXPVz`