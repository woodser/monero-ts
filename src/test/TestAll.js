// import library models
require("../../index.js");

// import test types
require("./utils/TestUtilsModule")();
const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc");
const TestMoneroWalletKeys = require("./TestMoneroWalletKeys");
const TestMoneroWalletCore = require("./TestMoneroWalletCore");

//// test sample code for readme
//require("./TestSampleCode");

// test utilitiles
require("./TestMoneroUtils");

//// test daemon rpc
//new TestMoneroDaemonRpc().runTests({
//  liteMode: false,  // skips some thorough but lengthy tests
//  testNonRelays: true,
//  testRelays: true, // creates and relays outgoing txs
//  testNotifications: true
//});
//
//// test wallet rpc
//new TestMoneroWalletRpc().runTests({
//  liteMode: false, // skips some lengthy but detailed tests
//  testNonRelays: true,
//  testRelays: true,
//  testNotifications: true,
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

// test core wallet
new TestMoneroWalletCore().runTests({
  liteMode: false,
  testNonRelays: true,
  testRelays: false,
  testResets: false,
  testNotifications: false
});

//// test boolean set (data structure used by wallet to track progress)
//require("./TestBooleanSet");
//
//// test scratchpad
//require("./Scratchpad");