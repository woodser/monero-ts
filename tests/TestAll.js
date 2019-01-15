const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")

// test daemon rpc
new TestMoneroDaemonRpc().runTests({
  testNotifications: true
});

// test wallet rpc
new TestMoneroWalletRpc().runTests({
  testNonSends: true,
  liteMode: true, // skips some lengthy tests // TODO: lengthy tests still need to be runnable but getting test timeout
  testSends: true,
  testResets: false,
  testNotifications: true
});

// test core utils
require("./TestMoneroCoreUtils");

//test sample code for readme
require("./TestSampleCode");

//// test wallet local
//new TestMoneroWalletLocal().runTests({
//  testNonSends: true,
//  testSends: false,
//  testResets: false,
//  testNotifications: false
//});

// test wallet equality
require("./TestMoneroWalletEquality");

// test boolean set (data structure used by wallet to track progress)
require("./TestBooleanSet");

//// test scratchpad
//require("./Scratchpad");