# Creating wallets

Three types of wallets can be created:

* [RPC wallet](#rpc-wallet) - client connected to a monero-wallet-rpc server.
* [WebAssembly wallet](#webassembly-wallet) - client-side wallet which communicates directly with a daemon.
* [Keys-only wallet](#keys-only-wallet) - client-side wallet which supports only basic key management.

## RPC wallet

This example creates a client connected to monero-wallet-rpc then creates a wallet.

See [MoneroWalletRpc.createWallet()](https://moneroecosystem.org/monero-ts/typedocs/classes/MoneroWalletRpc.html#createWallet) for all options.

```typescript
// create a client connected to monero-wallet-rpc
let walletRpc = await moneroTs.connectToWalletRpc("http://localhost:38081", "superuser", "abctesting123");

// create a wallet on monero-wallet-rpc
await walletRpc.createWallet({
  path: "mywallet",
  password: "supersecretpassword",
  seed: "coexist igloo pamphlet lagoon...",
  restoreHeight: 1543218
}); 
```

## WebAssembly wallet

This example creates a wallet using WebAssembly bindings to [wallet2.h](https://github.com/monero-project/monero/blob/master/src/wallet/wallet2.h).

See [MoneroWalletFull.createWallet()](https://moneroecosystem.org/monero-ts/typedocs/classes/MoneroWalletFull.html#createWallet) for all options.

```typescript
// create wallet using WebAssembly
let wallet = await moneroTs.createWalletFull({
   path: "./test_wallets/wallet1", // leave blank for in-memory wallet
   password: "supersecretpassword",
   networkType: moneroTs.MoneroNetworkType.STAGENET
   seed: "coexist igloo pamphlet lagoon...",
   restoreHeight: 1543218,
   server: {
      uri: "http://localhost:38081",
      username: "daemon_user",
      password: "daemon_password_123"
   }
});
```

## Keys-only wallet

This example creates a keys-only wallet using WebAssembly bindings to monero-project/monero.

See [MoneroWalletKeys.createWallet()](https://moneroecosystem.org/monero-ts/typedocs/classes/MoneroWalletKeys.html#createWallet) for all options.

```typescript
// create keys-only wallet
let wallet = await moneroTs.createWalletKeys({
   password: "abc123",
   networkType: moneroTs.MoneroNetworkType.STAGENET,
   seed: "coexist igloo pamphlet lagoon..."
});
```