const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")

// test daemon rpc
new TestMoneroDaemonRpc().runTests({testNotifications: true});

// test wallet rpc
new TestMoneroWalletRpc().runTests({
  testNonSends: true,
  testNonSendsLite: true, // skips some lengthy tests // TODO: lengthy tests still need to runnable but get test timeout
  testSends: true,
  testResets: false,
  testNotifications: false
});

// test wallet local
new TestMoneroWalletLocal().runTests({
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