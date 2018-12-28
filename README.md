# Monero JavaScript API

## Introduction

This project provides a modern (ES2017+) JavaScript API for a Monero wallet and daemon.

The API currently relies on running instances of [Monero Wallet RPC](https://getmonero.org/resources/developer-guides/wallet-rpc.html) and [Monero Daemon RPC](https://getmonero.org/resources/developer-guides/daemon-rpc.html).

Primary goals of this project are to implement a fully client-side JavaScript wallet and a "light wallet" which shares the view key with a 3rd party (e.g. MyMonero) to scan the blockchain.

## Code Samples

```js
// create a wallet that uses a monero-wallet-rpc endpoint
let wallet = new MoneroWalletRpc({uri: 'https://localhost:38083', user: 'rpc_user', pass: 'abc123'});

// basic wallet info
let balance = await wallet.getBalance();               // e.g. 533648366742
let primaryAddress = await wallet.getPrimaryAddress(); // e.g. 59aZULsUF3YNSKGiHz4JPMfjGYkm1S4TB3sPsTr3j85HhXb9crZqGa7jJ8cA87U48kT5wzi2VzGZnN2PKojEwoyaHqtpeZh

// send a payment
let sentTx1 = await wallet.send("59aZULsUF3YNSKGiHz4JPMfjGYkm1S4TB3sPsTr3j85HhXb9crZqGa7jJ8cA87U48kT5wzi2VzGZnN2PKojEwoyaHqtpeZh", new BigInteger(50000000));

// send payments from subaddress 0, 1 to multiple destinations in a single transaction
let payments = [];
payments.push(new MoneroPayment("7BV7iyk9T6kfs7cPfmn7vPZPyWRid7WEwecBkkVr8fpw9MmUgXTPtvMKXuuzqKyr2BegWMhEcGGEt5vNkmJEtgnRFUAvf29", new BigInteger(50000000));
payments.push(new MoneroPayment("78NWrWGgyZeYgckJhuxmtDMqo8Kzq5r9j1kV8BQXGq5CDnECz2KjQeBDc3KKvdMQmR6TWtfbRaedgbSGmmwr1g8N1rBMdvW", new BigInteger(50000000));
let sendConfig = new MoneroSendConfig();
sendConfig.setPayments(payments);
sendConfig.setAccountIndex(0);
sendConfig.setSubaddressIndex(1);
let sentTx2 = await wallet.send(sendConfig);

// print all wallet transactions (also supports detailed filtering)
for (let tx of await wallet.getTxs()) {
	console.log(tx.getId());             // e.g. f8b2f0baa80bf6b686ce32f99ff7bb15a0f198baf7aed478e933ee9a73c69f80
	console.log(tx.getFee());            // e.g. 752343011023
	console.log(tx.getIsConfirmed());    // e.g. false
}
```

## JavaScript Setup

## Monero RPC Setup

## Interfaces and Data Models

- [Monero daemon interface (MoneroDaemon.js)](src/daemon/MoneroDaemon.js)
- [Monero daemon rpc implementation (MoneroDaemonRpc.js)](src/daemon/MoneroDaemonRpc.js)
- [Monero daemon data model (src/daemon/model)](src/daemon/model)
- [Monero wallet interface (src/wallet/MoneroWallet.js](src/wallet/MoneroWallet.js)
- [Monero wallet rpc implementation (src/wallet/MoneroWalletRpc.js)](src/wallet/MoneroWalletRpc.js)
- [Monero wallet data model (src/wallet/model)](src/wallet/model)

## Running Tests

TODO

## Future Goals

Primary goals of this project are to implement:

- A wallet that scans the blockchain locally and does not share the view key (requires a node running monero-daemon-rpc)
- A wallet that shares the view key with a MyMonero-compatible server to remotely scan the blockchain (future consideration)

## License

This project is licensed under MIT.