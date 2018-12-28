# Monero JavaScript API

## Introduction

This project provides a JavaScript API for a Monero wallet and daemon.

Currently, the service interfaces rely on running instances of [Monero Wallet RPC](https://getmonero.org/resources/developer-guides/wallet-rpc.html) and [Monero Daemon RPC](https://getmonero.org/resources/developer-guides/daemon-rpc.html).

## Code Samples

## JavaScript Setup

## Monero RPC Setup

## JavaScript API

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