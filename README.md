# Monero JavaScript API

## Introduction

This project provides a JavaScript API (data models and service interfaces) for a Monero wallet and daemon.

Currently, the service interfaces rely on running instances of [Monero Wallet RPC](https://getmonero.org/resources/developer-guides/wallet-rpc.html) and [Monero Daemon](https://getmonero.org/resources/developer-guides/daemon-rpc.html).

## Code Samples

## JavaScript Setup

## Monero RPC Setup

## Future Goals

- A wallet implementation that scans the blockchain locally and does not share the view key (requires a node running monero-daemon-rpc)
- A wallet implementation that shares the view key with a MyMonero-compatible server to remotely scan the blockchain (future consideration)

## Running Tests

TODO

## JavaScript API

[MoneroDaemon.js](src/daemon/MoneroDaemon.js) implemented by [MoneroDaemonRpc.js](src/daemon/MoneroDaemonRpc.js)
[MoneroWallet.js](src/wallet/MoneroWallet.js) implemented by [MoneroWalletRpc.js](src/wallet/MoneroWalletRpc.js)
[Monero wallet data model](src/wallet/model)
[Monero daemon data model](src/daemon/model]

## License

This project is licensed under MIT.