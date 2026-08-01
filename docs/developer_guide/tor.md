# Using Tor

First start a Tor node and get its local SOCKS5 proxy URI (outside the scope of monero-ts).

Requests are routed through the proxy as SOCKS5, and hostnames (including .onion addresses) are resolved by the proxy to avoid DNS leaks.

Note: proxied requests are supported in Node.js, not in a browser.

## Using Tor with monerod

```typescript
import moneroTs from "monero-ts";

// create client connected to monerod with tor config
let daemon = await moneroTs.connectToDaemonRpc({
  uri: "http://kyaklhqp4yyza4fmtbvs6z4lrzr5cljxwa7o2d42sfelfhczsmbwzfad.onion:18081",
  username: "superuser",
  password: "abctesting123",
  proxyUri: "socks5h://127.0.0.1:9050"
});
```

## Using Tor with monero-wallet-rpc

```typescript
// create client connected to your monero-wallet-rpc instance
let walletRpc = await moneroTs.connectToWalletRpc("http://localhost:38084", "rpc_user", "abc123");

// open or create a wallet
// ...

// set connection to monerod with tor config
await walletRpc.setDaemonConnection(new moneroTs.MoneroRpcConnection({
  uri: "http://kyaklhqp4yyza4fmtbvs6z4lrzr5cljxwa7o2d42sfelfhczsmbwzfad.onion:18081",
  username: "superuser",
  password: "abctesting123",
  proxyUri: "socks5h://127.0.0.1:9050"
}));
```

## Using Tor with a client-side wallet

```typescript
// option 1: create or open full wallet with tor config
let walletFull = await moneroTs.createWalletFull({
  path: "sample_wallet_full",
  password: "supersecretpassword123",
  networkType: moneroTs.MoneroNetworkType.MAINNET,
  seed: "hefty value scenic...",
  restoreHeight: 573936,
  server: {
    uri: "http://kyaklhqp4yyza4fmtbvs6z4lrzr5cljxwa7o2d42sfelfhczsmbwzfad.onion:18081",
    username: "superuser",
    password: "abctesting123",
    proxyUri: "socks5h://127.0.0.1:9050"
  }
});

// option 2: set connection to monerod with tor config
await walletFull.setDaemonConnection(new moneroTs.MoneroRpcConnection({
  uri: "http://kyaklhqp4yyza4fmtbvs6z4lrzr5cljxwa7o2d42sfelfhczsmbwzfad.onion:18081",
  username: "superuser",
  password: "abctesting123",
  proxyUri: "socks5h://127.0.0.1:9050"
}));
```
