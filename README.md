# Monero JavaScript Library

This project is a library for using a Monero wallet and daemon in JavaScript (NodeJS) using RPC bindings to [monero-wallet-rpc](https://getmonero.org/resources/developer-guides/wallet-rpc.html) and [monero-daemon-rpc](https://getmonero.org/resources/developer-guides/daemon-rpc.html).

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

1. `npm install monero-javascript`

    Or
    
    Make a directory and clone the JavaScript repisitory: `git clone --recurse-submodules https://github.com/monero-ecosystem/monero-javascript.git`
2. Install dependencies using Node Package Manager: `npm install`

You are now ready to use this library with [monero-daemon-rpc](https://getmonero.org/resources/developer-guides/daemon-rpc.html) and [monero-wallet-rpc](https://getmonero.org/resources/developer-guides/wallet-rpc.html) endpoints.

## How to Set Up Monero RPC

1. Download and extract the latest [Monero CLI](https://getmonero.org/downloads/) for your platform.
2. Start Monero daemon locally: `./monerod --stagenet` (or use a remote daemon).
3. Create a wallet file if one does not exist.
	- Create new / open existing: `./monero-wallet-cli --daemon-address http://localhost:38081 --stagenet`
	- Restore from mnemonic seed: `./monero-wallet-cli --daemon-address http://localhost:38081 --stagenet --restore-deterministic-wallet`
4. Start monero-wallet-rpc (requires --wallet-dir to run tests):
	
	e.g. For wallet name `test_wallet_1`, user `rpc_user`, password `abc123`, stagenet: `./monero-wallet-rpc --daemon-address http://localhost:38081 --stagenet --rpc-bind-port 38083 --rpc-login rpc_user:abc123 --wallet-dir /Applications/monero-v0.14.0.3`

## How to Run Mocha Tests

1. Download this project and install its dependenices.  See [How to Run This Library](#how-to-run-this-library).
2. Run [monero-wallet-rpc](https://getmonero.org/resources/developer-guides/wallet-rpc.html) and [monero-daemon-rpc](https://getmonero.org/resources/developer-guides/daemon-rpc.html).  See [How to Set Up Monero RPC](#how-to-set-up-monero-rpc).
3. Configure the appropriate RPC endpoints and authentication by modifying `WALLET_RPC_CONFIG` and `DAEMON_RPC_CONFIG` in [TestUtils.js](src/test/TestUtils.js).
4. Run all tests: `npm test` or run tests by their description, e.g.: `node_modules/mocha/bin/mocha src/test/TestAll --grep "Can get transactions by id" --timeout 2000000`

## How to Run the Sample Browser Application

A simple web application is included in `./browser_app` to demonstrate using this library in a browser.

1. Start monero-daemon-rpc with authentication and CORS access.  For example: `./monerod --stagenet --rpc-login superuser:abctesting123 --rpc-access-control-origins http://localhost:9100`
2. Start monero-wallet-rpc with authentication and CORS access.  For example: `./monero-wallet-rpc --daemon-address http://localhost:38081 --daemon-login superuser:abctesting123 --stagenet --rpc-bind-port 38083 --rpc-login rpc_user:abc123 --rpc-access-control-origins http://localhost:9100 --wallet-dir ./`
3. Build the web app for the browser: `./bin/start_dev_browser`
5. Manually copy ./browser_app/index.html to ./browser_build/index.html
6. Manually copy the 4 asm files from ./external/mymonero-core-js/monero_utils to ./browser_build/submodules/mymonero-core-js/monero_utils/
7. Access the application using a web browser.  For example, open http://localhost:9100.

Note: The server used in these steps, SimpleHTTPServer, incorrectly serves WASM files with content-type "octet-stream" which fails in Firefox.  This issue can be resolved by using a different HTTP server or browser.

## Project Goals

- Offer consistent terminology and APIs for Monero's developer ecosystem
- Build a wallet adapter for a local wallet which uses client-side crypto and a daemon
- Build a wallet adapter for a MyMonero wallet which shares the view key with a 3rd party to scan the blockchain

## See Also

These libraries conform to the same [API specification](http://moneroecosystem.org/monero-java/monero-spec.pdf).

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