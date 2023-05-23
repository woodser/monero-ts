const assert = require("assert");
const TestUtils = require("./utils/TestUtils");
const monerojs = require("../../index");
const GenUtils = monerojs.GenUtils;
const MoneroRpcConnection = monerojs.MoneroRpcConnection;
const MoneroConnectionManager = monerojs.MoneroConnectionManager;
const MoneroConnectionManagerListener = monerojs.MoneroConnectionManagerListener;

/**
 * Test the Monero RPC connection manager.
 */
class TestMoneroConnectionManager {
  
  runTests() {
    describe("Test connection manager", function() {
      it("Can manage connections", async function() {
        let err;
        let walletRpcs = [];
        try {
          
          // start monero-wallet-rpc instances as test server connections (can also use monerod servers)
          for (let i = 0; i < 5; i++) walletRpcs.push(await TestUtils.startWalletRpcProcess());
          
          // create connection manager
          let connectionManager = new MoneroConnectionManager();
          
          // listen for changes
          let listener = new ConnectionChangeCollector();
          connectionManager.addListener(listener);
          
          // add prioritized connections
          connectionManager.addConnection(walletRpcs[4].getRpcConnection().setPriority(1));
          connectionManager.addConnection(walletRpcs[2].getRpcConnection().setPriority(2));
          connectionManager.addConnection(walletRpcs[3].getRpcConnection().setPriority(2));
          connectionManager.addConnection(walletRpcs[0].getRpcConnection()); // default priority is lowest
          connectionManager.addConnection(new MoneroRpcConnection(walletRpcs[1].getRpcConnection().getUri())); // test unauthenticated
          
          // test connections and order
          let orderedConnections = connectionManager.getConnections();
          assert(orderedConnections[0] === walletRpcs[4].getRpcConnection());
          assert(orderedConnections[1] === walletRpcs[2].getRpcConnection());
          assert(orderedConnections[2] === walletRpcs[3].getRpcConnection());
          assert(orderedConnections[3] === walletRpcs[0].getRpcConnection());
          assert.equal(orderedConnections[4].getUri(), (walletRpcs[1].getRpcConnection()).getUri());
          for (let connection of orderedConnections) assert.equal(undefined, connection.isOnline());

          // test unknown connection
          let numExpectedChanges = 0;
          await connectionManager.setConnection(orderedConnections[0]);
          assert.equal(connectionManager.isConnected(), undefined);
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          
          // auto connect to best available connection
          connectionManager.setAutoSwitch(true);
          await connectionManager.startCheckingConnection(TestUtils.SYNC_PERIOD_IN_MS);
          assert(connectionManager.isConnected());
          let connection = connectionManager.getConnection();
          assert(connection.isOnline());
          assert(connection === walletRpcs[4].getRpcConnection());
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert(listener.changedConnections[listener.changedConnections.length - 1] === connection);
          connectionManager.setAutoSwitch(false);
          connectionManager.stopCheckingConnection();
          connectionManager.disconnect();
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert(listener.changedConnections[listener.changedConnections.length - 1] === undefined);
          
          // start periodically checking connection
          await connectionManager.startCheckingConnection(TestUtils.SYNC_PERIOD_IN_MS);
          
          // connect to best available connection in order of priority and response time
          connection = await connectionManager.getBestAvailableConnection();
          connectionManager.setConnection(connection);
          assert(connection === walletRpcs[4].getRpcConnection());
          assert(connection.isOnline());
          assert(connection.isAuthenticated());
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert(listener.changedConnections[listener.changedConnections.length - 1] === connection);
          
          // test connections and order
          orderedConnections = connectionManager.getConnections();
          assert(orderedConnections[0] === walletRpcs[4].getRpcConnection());
          assert(orderedConnections[1] === walletRpcs[2].getRpcConnection());
          assert(orderedConnections[2] === walletRpcs[3].getRpcConnection());
          assert(orderedConnections[3] === walletRpcs[0].getRpcConnection());
          assert.equal(orderedConnections[4].getUri(), walletRpcs[1].getRpcConnection().getUri());
          for (let i = 1; i < orderedConnections.length; i++) assert.equal(undefined, orderedConnections[i].isOnline());
          
          // shut down prioritized servers
          walletRpcs[2].getRpcConnection()._setFakeDisconnected(true); // browser does not start or stop instances
          walletRpcs[3].getRpcConnection()._setFakeDisconnected(true);
          walletRpcs[4].getRpcConnection()._setFakeDisconnected(true);
          await GenUtils.waitFor(TestUtils.SYNC_PERIOD_IN_MS + 100);
          assert.equal(false, connectionManager.isConnected());
          assert.equal(false, connectionManager.getConnection().isOnline());
          assert.equal(undefined, connectionManager.getConnection().isAuthenticated());
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert(listener.changedConnections[listener.changedConnections.length - 1] === connectionManager.getConnection());
          
          // test connection order
          orderedConnections = connectionManager.getConnections();
          assert(orderedConnections[0] === walletRpcs[4].getRpcConnection());
          assert(orderedConnections[1] === walletRpcs[2].getRpcConnection());
          assert(orderedConnections[2] === walletRpcs[3].getRpcConnection());
          assert(orderedConnections[3] === walletRpcs[0].getRpcConnection());
          assert.equal(orderedConnections[4].getUri(), walletRpcs[1].getRpcConnection().getUri());
          
          // check all connections
          await connectionManager.checkConnections();
          
          // test connection order
          orderedConnections = connectionManager.getConnections();
          assert(orderedConnections[0] === walletRpcs[4].getRpcConnection());
          assert(orderedConnections[1] === walletRpcs[0].getRpcConnection());
          assert(orderedConnections[2].getUri() === walletRpcs[1].getRpcConnection().getUri());
          assert(orderedConnections[3] === walletRpcs[2].getRpcConnection());
          assert(orderedConnections[4] === walletRpcs[3].getRpcConnection());
          
          // test online and authentication status
          for (let i = 0; i < orderedConnections.length; i++) {
            let isOnline = orderedConnections[i].isOnline();
            let isAuthenticated = orderedConnections[i].isAuthenticated();
            if (i === 1 || i === 2) assert.equal(true, isOnline);
            else assert.equal(false, isOnline);
            if (i === 1) assert.equal(true, isAuthenticated);
            else if (i === 2) assert.equal(false, isAuthenticated);
            else assert.equal(undefined, isAuthenticated);
          }
          
          // test auto switch when disconnected
          connectionManager.setAutoSwitch(true);
          await GenUtils.waitFor(TestUtils.SYNC_PERIOD_IN_MS + 100); // allow time to poll
          assert(connectionManager.isConnected());
          connection = connectionManager.getConnection();
          assert(connection.isOnline());
          assert(connection === walletRpcs[0].getRpcConnection());
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert(listener.changedConnections[listener.changedConnections.length - 1] === connection);
          
          // test connection order
          orderedConnections = connectionManager.getConnections();
          assert(orderedConnections[0] === connection);
          assert(orderedConnections[0] === walletRpcs[0].getRpcConnection());
          assert(orderedConnections[1].getUri() === walletRpcs[1].getRpcConnection().getUri());
          assert(orderedConnections[2] === walletRpcs[4].getRpcConnection());
          assert(orderedConnections[3] === walletRpcs[2].getRpcConnection());
          assert(orderedConnections[4] === walletRpcs[3].getRpcConnection());
          
          // connect to specific endpoint without authentication
          connection = orderedConnections[1];
          assert.equal(false, connection.isAuthenticated());
          connectionManager.setConnection(connection);
          assert.equal(false, connectionManager.isConnected());
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          
          // connect to specific endpoint with authentication
          connectionManager.setAutoSwitch(false);
          orderedConnections[1].setCredentials("rpc_user", "abc123");
          await connectionManager.checkConnection();
          assert.equal(connection.getUri(), walletRpcs[1].getRpcConnection().getUri());
          assert(connection.isOnline());
          assert(connection.isAuthenticated());
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert(listener.changedConnections[listener.changedConnections.length - 1] === connection);
          
          // test connection order
          orderedConnections = connectionManager.getConnections();
          assert(orderedConnections[0] === connectionManager.getConnection());
          assert.equal(orderedConnections[0].getUri(), walletRpcs[1].getRpcConnection().getUri());
          assert(orderedConnections[1] === walletRpcs[0].getRpcConnection());
          assert(orderedConnections[2] === walletRpcs[4].getRpcConnection());
          assert(orderedConnections[3] === walletRpcs[2].getRpcConnection());
          assert(orderedConnections[4] === walletRpcs[3].getRpcConnection());
          for (let i = 0; i < orderedConnections.length; i++) assert(i <= 1 ? orderedConnections[i].isOnline() : !orderedConnections[i].isOnline());
          
          // set connection to existing uri
          connectionManager.setConnection(walletRpcs[0].getRpcConnection().getUri());
          assert(connectionManager.isConnected());
          assert(walletRpcs[0].getRpcConnection() === connectionManager.getConnection());
          assert.equal(TestUtils.WALLET_RPC_CONFIG.username, connectionManager.getConnection().getUsername());
          assert.equal(TestUtils.WALLET_RPC_CONFIG.password, connectionManager.getConnection().getPassword());
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert(listener.changedConnections[listener.changedConnections.length - 1] === walletRpcs[0].getRpcConnection());
          
          // set connection to new uri
          connectionManager.stopCheckingConnection();
          let uri = "http://localhost:49999";
          connectionManager.setConnection(uri);
          assert.equal(connectionManager.getConnection().getUri(), uri);
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert.equal(uri, listener.changedConnections[listener.changedConnections.length - 1].getUri());
          
          // set connection to empty string
          connectionManager.setConnection("");
          assert.equal(undefined, connectionManager.getConnection());
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          
          // check all connections and test auto switch
          connectionManager.setAutoSwitch(true);
          await connectionManager.checkConnections();
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert(connectionManager.isConnected());

          // remove current connection and test auto switch
          await connectionManager.removeConnection(connectionManager.getConnection().getUri());
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert.equal(connectionManager.isConnected(), false);
          await connectionManager.checkConnections();
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert(connectionManager.isConnected());

          // check connection promises
          await Promise.all(connectionManager.checkConnectionPromises());
          
          // shut down all connections
          connection = connectionManager.getConnection();
          await connectionManager.startCheckingConnection(TestUtils.SYNC_PERIOD_IN_MS);
          for (let connection of orderedConnections) connection._setFakeDisconnected(true);
          await GenUtils.waitFor(TestUtils.SYNC_PERIOD_IN_MS + 100);
          assert.equal(false, connection.isOnline());
          assert.equal(listener.changedConnections.length, ++numExpectedChanges);
          assert(listener.changedConnections[listener.changedConnections.length - 1] === connection);
          
          // reset
          connectionManager.reset();
          assert.equal(connectionManager.getConnections().length, 0);
          assert.equal(connectionManager.getConnection(), undefined);
        } catch(err2) {
          err = err2;
        }
        
        // stop monero-wallet-rpc instances
        for (let walletRpc of walletRpcs) {
          try { await TestUtils.stopWalletRpcProcess(walletRpc); }
          catch (err2) { }
        }
        
        // throw error if applicable
        if (err) throw err;
      });
    });
  }
}

class ConnectionChangeCollector extends MoneroConnectionManagerListener {
  constructor() {
    super();
    this.changedConnections = [];
  }
  async onConnectionChanged(connection) {
    this.changedConnections.push(connection);
  }
}

module.exports = TestMoneroConnectionManager;