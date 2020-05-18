# Creating Wallets

## MoneroWalletRpc

This example creates a client connected to monero-wallet-rpc then creates a wallet.

See [MoneroWalletRpc.createWallet()](https://moneroecosystem.org/monero-javascript/MoneroWalletRpc.html#createWallet) for all options.

```javascript

// create a client connected to monero-wallet-rpc
let walletRpc = new MoneroWalletRpc("http://localhost:38081", "superuser", "abctesting123");

// create a wallet on monero-wallet-rpc
await walletRpc.createWallet({
  path: "mywallet",
  password: "supersecretpassword",
  mnemonic: "coexist igloo pamphlet lagoon...",
  restoreHeight: 1543218l
}); 
```

## MoneroWalletWasm

This example creates a wallet using WebAssembly bindings to Monero Core's wallet2.h.

See [MoneroWalletWasm.createWallet()](https://moneroecosystem.org/monero-javascript/MoneroWalletWasm.html#createWallet) for all options.

```javascript
let wallet = await MoneroWalletWasm.createWallet({
   path: "./test_wallets/wallet1", // leave blank for in-memory wallet
   password: "supersecretpassword",
   networkType: MoneroNetworkType.STAGENET,
   mnemonic: "coexist igloo pamphlet lagoon...",
   restoreHeight: 1543218,
   server: new MoneroRpcConnection("http://localhost:38081", "daemon_user", "daemon_password_123"),
});
```

## MoneroWalletKeys

This example creates a keys-only wallet using WebAssembly bindings to Monero Core.

See [MoneroWalletKeys.createWallet()](https://moneroecosystem.org/monero-javascript/MoneroWalletKeys.html#createWallet) for all options.

```javascript
let wallet = await MoneroWalletKeys.createWallet({
   password: "abc123",
   networkType: MoneroNetworkType.STAGENET,
   mnemonic: "coexist igloo pamphlet lagoon..."
}); 
```