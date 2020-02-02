// import library models
require("../../index.js");

// import test types
require("./utils/TestUtilsModule")();
const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc");
const TestMoneroWalletKeys = require("./TestMoneroWalletKeys");
const TestMoneroWalletCore = require("./TestMoneroWalletCore");

//// test sample code for readme
//new TestSampleCode().runTests();

// test utilitiles
new TestMoneroUtils().runTests();

// test daemon rpc
new TestMoneroDaemonRpc().runTests({
  liteMode: true,  // skips some thorough but lengthy tests
  testNonRelays: true,
  testRelays: false, // creates and relays outgoing txs
  testNotifications: false
});

//// test wallet rpc
//new TestMoneroWalletRpc().runTests({
//  liteMode: true, // skips some lengthy but detailed tests
//  testNonRelays: true,
//  testRelays: true,
//  testNotifications: false,
//  testResets: false
//});

//// test keys-only wallet
//new TestMoneroWalletKeys().runTests({
//  liteMode: false,
//  testNonRelays: true,
//  testRelays: false,
//  testResets: false,
//  testNotifications: false
//});

//// test core wallet
//new TestMoneroWalletCore().runTests({
//  liteMode: true,
//  testNonRelays: true,
//  testRelays: true,
//  testResets: false,
//  testNotifications: false
//});

// test scratchpad
//require("./Scratchpad");

////test boolean set (data structure used by wallet to track progress)
//require("./TestBooleanSet");