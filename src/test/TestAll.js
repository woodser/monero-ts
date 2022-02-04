// import test types
const monerojs = require("../../index");
const LibraryUtils = monerojs.LibraryUtils;
const TestSampleCode = require("./TestSampleCode");
const TestMoneroUtils = require("./TestMoneroUtils");
const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletKeys = require("./TestMoneroWalletKeys");
const TestMoneroWalletFull = require("./TestMoneroWalletFull");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc");
const TestMoneroConnectionManager = require("./TestMoneroConnectionManager");

// set log level
LibraryUtils.setLogLevel(1); // no need for await before worker used

// test sample code for readme
new TestSampleCode().runTests();

// test utilitiles
new TestMoneroUtils().runTests();

// test daemon rpc
new TestMoneroDaemonRpc({
  liteMode: false,  // skip lengthy but thorough tests if true
  testNonRelays: true,
  testRelays: true, // creates and relays outgoing txs
  testNotifications: true
}).runTests();

// test keys-only wallet
new TestMoneroWalletKeys({
  liteMode: false,
  testNonRelays: true,
  testRelays: false,
  testNotifications: false,
  testResets: false
}).runTests();

// test full wallet
new TestMoneroWalletFull({
  liteMode: false,
  testNonRelays: true,
  testRelays: true,
  testNotifications: true,
  testResets: false
}).runTests();

// test wallet rpc
new TestMoneroWalletRpc({
  liteMode: false,
  testNonRelays: true,
  testRelays: true,
  testNotifications: true,
  testResets: false
}).runTests();

// test connection manager
new TestMoneroConnectionManager().runTests();

// test scratchpad
require("./Scratchpad");