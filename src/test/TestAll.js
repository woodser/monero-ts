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

//// test daemon rpc
//new TestMoneroDaemonRpc({
//  liteMode: true,  // skips some thorough but lengthy tests
//  testNonRelays: true,
//  testRelays: false, // creates and relays outgoing txs
//  testNotifications: false
//}).runTests();

//// test wallet rpc
//new TestMoneroWalletRpc({
//  liteMode: true, // skips some lengthy but detailed tests
//  testNonRelays: true,
//  testRelays: true,
//  testNotifications: false,
//  testResets: false
//}).runTests();

//// test keys-only wallet
//new TestMoneroWalletKeys({
//  liteMode: false,
//  testNonRelays: true,
//  testRelays: false,
//  testResets: false,
//  testNotifications: false
//}).runTests();

// test core wallet
new TestMoneroWalletCore({
  liteMode: true,
  testNonRelays: true,
  testRelays: false,
  testResets: false,
  testNotifications: false,
  fs: require('memfs')        // optionally use in-memory filesystem
}).runTests();

// test scratchpad
//require("./Scratchpad");

////test boolean set (data structure used by wallet to track progress)
//require("./TestBooleanSet");