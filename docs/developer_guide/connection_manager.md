# Connection Manager

The following code demonstrates how to use monero-javascript's connection manager to manage daemon or wallet RPC endpoints.

See [MoneroConnectionManager](https://moneroecosystem.org/monero-javascript/MoneroConnectionManager.html) or [TestMoneroConnectionManager.js](https://github.com/monero-ecosystem/monero-javascript/blob/master/src/test/TestMoneroConnectionManager.js) for more detail.

```javascript
// imports
const monerojs = require("monero-javascript");
const MoneroRpcConnection = monerojs.MoneroRpcConnection;
const MoneroConnectionManager = monerojs.MoneroConnectionManager;
const MoneroConnectionManagerListener = monerojs.MoneroConnectionManagerListener;

// create connection manager
let connectionManager = new MoneroConnectionManager();

// add managed connections with priorities
connectionManager.addConnection(new MoneroRpcConnection("http://localhost:38081").setPriority(1)); // use localhost as first priority
connectionManager.addConnection(new MoneroRpcConnection("http://example.com")); // default priority is prioritized last

// set current connection
connectionManager.setConnection(new MoneroRpcConnection("http://foo.bar", "admin", "password")); // connection is added if new

// create wallet with managed connections or set later
let walletFull = await monerojs.createWalletFull({
  path: "sample_wallet_full",
  password: "supersecretpassword123",
  networkType: "stagenet",
  connectionManager: connectionManager,
  seed: "hefty value scenic...",
  restoreHeight: 573936,
});

// check connection status
await connectionManager.checkConnection();
console.log("Connection manager is connected: " + connectionManager.isConnected());
console.log("Connection is online: " + connectionManager.getConnection().isOnline());
console.log("Connection is authenticated: " + connectionManager.getConnection().isAuthenticated());

// receive notifications of any changes to current connection
connectionManager.addListener(new class extends MoneroConnectionManagerListener {
  onConnectionChanged(connection) {
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
connectionManager.clear();
```