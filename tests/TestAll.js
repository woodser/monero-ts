const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")

// test daemon rpc
new TestMoneroDaemonRpc().runTests({
  liteMode: false,
  testNonRelays: true,
  testRelays: true, // creates and relays outgoing txs
  testNotifications: false
});

//// test wallet rpc
//new TestMoneroWalletRpc().runTests({
//  liteMode: false, // skips some lengthy tests
//  testNonSends: true,
//  testSends: true,
//  testResets: false,
//  testNotifications: false
//});
//
////test sample code for readme
//require("./TestSampleCode");
//
//// test core utils
//require("./TestMoneroCoreUtils");
//
//// test wallet local
//new TestMoneroWalletLocal().runTests({
//  testNonSends: true,
//  testSends: false,
//  testResets: false,
//  testNotifications: false
//});
//
//// test wallet equality
//require("./TestMoneroWalletEquality");
//
//// test boolean set (data structure used by wallet to track progress)
//require("./TestBooleanSet");

// test scratchpad
//require("./Scratchpad");