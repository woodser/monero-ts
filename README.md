# Monero JavaScript API

**Compatible with Monero Core version 14.0.3**

## Introduction

This project provides a modern JavaScript API for a Monero wallet and daemon.

The API currently relies on running instances of [Monero Wallet RPC](https://getmonero.org/resources/developer-guides/wallet-rpc.html) and [Monero Daemon RPC](https://getmonero.org/resources/developer-guides/daemon-rpc.html).  Primary goals of this project are to support a local wallet with client-side crypto and a MyMonero wallet which shares the view key with a 3rd party to scan the blockchain.

Main Features

- General-purpose library with focus on ease-of-use
- Clear object-oriented models to formalize Monero types and their relationships to each other
- Powerful API to query transactions, transfers, and vouts by their attributes
- Extensive test suite (130+ passing tests)
- Fetch and process binary data from the daemon in JavaScript using client-side crypto

A quick reference of the wallet and daemon data models can be found [here](monero-model.pdf).

## Wallet Sample Code

See the [tests](tests) for the most complete examples of using this library.

```js
// create a wallet that uses a monero-wallet-rpc endpoint
let wallet = new MoneroWalletRpc({
  uri: "http://localhost:38083",
  user: "rpc_user",
  pass: "abc123"
});

// get wallet balance as BigInteger
let balance = await wallet.getBalance();  // e.g. 533648366742
   
// get wallet primary address
let primaryAddress = await wallet.getPrimaryAddress();  // e.g. 59aZULsUF3YNSKGiHz4J...
    
// get address and balance of subaddress [1, 0]
let subaddress = await wallet.getSubaddress(1, 0);
let subaddressBalance = subaddress.getBalance();
let subaddressAddress = subaddress.getAddress();

// send to an address
let sentTx = await wallet.send("74oAtjgE2dfD1bJBo4DW...", new BigInteger(50000));

// send to multiple destinations from subaddress 1, 0 which can be split into multiple transactions
// see MoneroSendConfig.js for all config options or to build a config object
let sentTxs = await wallet.sendSplit({
  destinations: [
    { address: "7BV7iyk9T6kfs7cPfmn7...", amount: new BigInteger(50000) },
    { address: "78NWrWGgyZeYgckJhuxm...", amount: new BigInteger(50000) }
  ],
  accountIndex: 1,
  subaddressIndices: [0]
});

// get confirmed transactions
for (let tx of await wallet.getTxs({isConfirmed: true})) {
  let txId = tx.getId();                 // e.g. f8b2f0baa80bf6b...
  let txFee = tx.getFee();               // e.g. 750000
  let isConfirmed = tx.getIsConfirmed(); // e.g. true
}

// get incoming transfers to account 0
for (let transfer of await wallet.getTransfers({isIncoming: true, accountIndex: 0})) {
  let amount = transfer.getAmount();     // e.g. 752343011023
}
```

## Daemon Sample Code

```js
// create a daemon that uses a monero-daemon-rpc endpoint
let daemon = new MoneroDaemonRpc({uri: "http://localhost:38081"});

// get daemon info
let height = await daemon.getHeight();           // e.g. 1523651
let feeEstimate = await daemon.getFeeEstimate(); // e.g. 750000

// get first 100 blocks as a binary request
let blocks = await daemon.getBlocksByRange(0, 100);

// get block info
for (let block of blocks) {
  let blockHeight = block.getHeader().getHeight();
  let blockId = block.getHeader().getId();
  let blockSize = block.getHeader().getSize();
  let txCount = block.getTxs().length;
}
```

## Running Tests

1. Set up running instances of [Monero Wallet RPC](https://getmonero.org/resources/developer-guides/wallet-rpc.html) and [Monero Daemon RPC](https://getmonero.org/resources/developer-guides/daemon-rpc.html).  See [Monero RPC Setup](#monero-rpc-setup).
2. `git clone --recurse-submodules https://github.com/woodser/monero-javascript.git`
3. `npm install`
4. Configure the appropriate RPC endpoints and authentication by modifying `WALLET_RPC_CONFIG` and `DAEMON_RPC_CONFIG` in [TestUtils.js](tests/TestUtils.js).
5. `npm test`

Note: some tests are failing as not all functionality is implemented.

## Monero RPC Setup

1. Download and extract the latest [Monero CLI](https://getmonero.org/downloads/) for your platform.
2. Start Monero daemon locally: `./monerod --stagenet` (or use a remote daemon).
3. Create a wallet file if one does not exist.  This is only necessary one time.
	- Create new / open existing: `./monero-wallet-cli --daemon-address http://localhost:38081 --stagenet`
	- Restore from mnemonic seed: `./monero-wallet-cli --daemon-address http://localhost:38081 --stagenet --restore-deterministic-wallet`
4. Start monero-wallet-rpc (requires --wallet-dir to run tests):
	
	e.g. For wallet name `test_wallet_1`, user `rpc_user`, password `abc123`, stagenet: `./monero-wallet-rpc --daemon-address http://localhost:38081 --stagenet --rpc-bind-port 38083 --rpc-login rpc_user:abc123 --wallet-dir /Applications/monero-v0.13.0.2`

## Interfaces and Types

- [Monero daemon (MoneroDaemon.js)](src/daemon/MoneroDaemon.js)
- [Monero daemon rpc implementation (MoneroDaemonRpc.js)](src/daemon/MoneroDaemonRpc.js)
- [Monero daemon model (src/daemon/model)](src/daemon/model)
- [Monero wallet (src/wallet/MoneroWallet.js)](src/wallet/MoneroWallet.js)
- [Monero wallet rpc implementation (src/wallet/MoneroWalletRpc.js)](src/wallet/MoneroWalletRpc.js)
- [Monero wallet model (src/wallet/model)](src/wallet/model)

## Project Goals

- Offer consistent terminology and APIs for Monero's developer ecosystem
- Build a wallet adapter for a local wallet which uses client-side crypto and a daemon
- Build a wallet adapter for a MyMonero wallet which shares the view key with a 3rd party to scan the blockchain

## License

This project is licensed under MIT.

## Donate

<p align="center">
	<img src="donate.png" width="150" height="150"/>
</p>

`46FR1GKVqFNQnDiFkH7AuzbUBrGQwz2VdaXTDD4jcjRE8YkkoTYTmZ2Vohsz9gLSqkj5EM6ai9Q7sBoX4FPPYJdGKQQXPVz`

Thank you supporting this project.