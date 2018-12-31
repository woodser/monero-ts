const MoneroDaemonRpcTester = require("./MoneroDaemonRpcTester");
const MoneroWalletRpcTester = require("./MoneroWalletRpcTester")
const MoneroWalletLocalTester = require("./MoneroWalletLocalTester")

// test daemon rpc
new MoneroDaemonRpcTester().runTests({testNotifications: true});

// test wallet rpc
new MoneroWalletRpcTester().runTests({
  testNonSends: true,
  testNonSendsLite: true, // skips some lengthy tests // TODO: lengthy tests still need to runnable but get test timeout
  testSends: true,
  testResets: false,
  testNotifications: true
});

// test wallet local
new MoneroWalletLocalTester().runTests({
  testNonSends: true,
  testSends: false,
  testResets: false,
  testNotifications: false
});

// test wallet equality
require("./TestMoneroWalletEquality");

// test core utils
require("./TestMoneroCoreUtils");

// test boolean set (data structure used by wallet to track progress)
require("./TestBooleanSet");

// test sample code for readme
require("./TestSampleCode");