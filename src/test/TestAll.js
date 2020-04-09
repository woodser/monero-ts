// import library models
require("../../index.js");

// import test types
require("./MoneroTestModel")();
require("./utils/TestUtilsModule")();

// test config
//TestUtils.FS = require('memfs');  // use in-memory file system

// test sample code for readme
new TestSampleCode().runTests();

// test utilitiles
new TestMoneroUtils().runTests();

// test daemon rpc
new TestMoneroDaemonRpc({
  liteMode: true,   // skips some lengthy but thorough tests
  testNonRelays: true,
  testRelays: true, // creates and relays outgoing txs
  testNotifications: true
}).runTests();

// test keys-only wallet
new TestMoneroWalletKeys({
  liteMode: false,
  testNonRelays: true,
  testRelays: false,
  testResets: false,
  testNotifications: false
}).runTests();

// test core wallet
new TestMoneroWalletCore({
  liteMode: false,
  testNonRelays: true,
  testRelays: true,
  testResets: false,
  testNotifications: true
}).runTests();

// test wallet rpc
new TestMoneroWalletRpc({
  liteMode: false,
  testNonRelays: true,
  testRelays: true,
  testNotifications: false,
  testResets: false
}).runTests();

//// test scratchpad
//require("./Scratchpad");

////test boolean set (data structure used by wallet to track progress)
//require("./TestBooleanSet");