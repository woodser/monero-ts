const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")

// test sample code for readme
require("./TestSampleCode");

//test core utils
require("./TestMoneroCppUtils");

//// test daemon rpc
//new TestMoneroDaemonRpc().runTests({
//  liteMode: false,  // skips some lengthy but detailed tests
//  testNonRelays: true,
//  testRelays: true, // creates and relays outgoing txs
//  testNotifications: true
//});

// test wallet rpc
new TestMoneroWalletRpc().runTests({
  liteMode: true, // skips some lengthy but detailed tests
  testNonRelays: true,
  testRelays: true,
  testNotifications: true,
  testResets: false
});

// test wallet local
new TestMoneroWalletLocal().runTests({
  liteMode: true,
  testNonRelays: true,
  testRelays: true,
  testResets: false,
  testNotifications: false
});

//// test wallet equality
//require("./TestMoneroWalletEquality");

// test boolean set (data structure used by wallet to track progress)
require("./TestBooleanSet");

// test scratchpad
require("./Scratchpad");