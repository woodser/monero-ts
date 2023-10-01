# Connection Manager

The following code demonstrates how to use monero-ts's connection manager to manage daemon or wallet RPC endpoints.

See [MoneroConnectionManager](https://moneroecosystem.org/monero-ts/MoneroConnectionManager.html) or [TestMoneroConnectionManager.js](https://github.com/monero-ecosystem/monero-ts/blob/master/src/test/TestMoneroConnectionManager.js) for more detail.

```typescript
// import monero-ts (or import types individually)
import * as moneroTs from "monero-ts";

// create connection manager
let connectionManager = new moneroTs.MoneroConnectionManager();

// add managed connections with priorities
await connectionManager.addConnection({uri: "http://localhost:28081", priority: 1}); // use localhost as first priority
await connectionManager.addConnection("http://example.com"); // default priority is prioritized last

// set current connection
await connectionManager.setConnection({uri: "http://foo.bar", username: "admin", password: "password"}); // connection is added if new

// create wallet governed by connection manager
let walletFull = await moneroTs.createWalletFull({
  path: "sample_wallet_full"
  password: "supersecretpassword123",
  networkType: moneroTs.MoneroNetworkType.TESTNET,
  connectionManager: connectionManager,
  seed: "hefty value scenic...",
  restoreHeight: 573936
});

// check connection status
await connectionManager.checkConnection();

// receive notifications of any changes to current connection
connectionManager.addListener(new class extends moneroTs.MoneroConnectionManagerListener {
  async onConnectionChanged(connection: moneroTs.MoneroRpcConnection) {
    console.log("Connection changed to: " + connection);
  }
});

// check connections every 10 seconds (in order of priority) and switch to the best
await connectionManager.startPolling(10000);

// get best available connection in order of priority then response time
let bestConnection = await connectionManager.getBestAvailableConnection();

// check status of all connections
await connectionManager.checkConnections();

// get connections in order of current connection, online status from last check, priority, and name
let connections = connectionManager.getConnections();

// clear connection manager
await connectionManager.clear();
```