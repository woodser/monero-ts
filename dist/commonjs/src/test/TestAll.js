"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _index = require("../../index");

var _TestSampleCode = _interopRequireDefault(require("./TestSampleCode"));

var _TestMoneroUtils = _interopRequireDefault(require("./TestMoneroUtils"));

var _TestMoneroDaemonRpc = _interopRequireDefault(require("./TestMoneroDaemonRpc"));

var _TestMoneroWalletKeys = _interopRequireDefault(require("./TestMoneroWalletKeys"));

var _TestMoneroWalletFull = _interopRequireDefault(require("./TestMoneroWalletFull"));

var _TestMoneroWalletRpc = _interopRequireDefault(require("./TestMoneroWalletRpc"));

var _TestMoneroConnectionManager = _interopRequireDefault(require("./TestMoneroConnectionManager"));

// import test types
// set log level
_index.LibraryUtils.setLogLevel(1); // no need for await before worker used
// test sample code for readme


new _TestSampleCode["default"]().runTests(); // test utilitiles

new _TestMoneroUtils["default"]().runTests(); // test daemon rpc

new _TestMoneroDaemonRpc["default"]({
  liteMode: false,
  // skip lengthy but thorough tests if true
  testNonRelays: true,
  testRelays: true,
  // creates and relays outgoing txs
  testNotifications: true
}).runTests(); // test keys-only wallet

new _TestMoneroWalletKeys["default"]({
  liteMode: false,
  testNonRelays: true,
  testRelays: false,
  testNotifications: false,
  testResets: false
}).runTests(); // test full wallet

new _TestMoneroWalletFull["default"]({
  liteMode: false,
  testNonRelays: true,
  testRelays: true,
  testNotifications: true,
  testResets: false
}).runTests(); // test wallet rpc

new _TestMoneroWalletRpc["default"]({
  liteMode: false,
  testNonRelays: true,
  testRelays: true,
  testNotifications: true,
  testResets: false
}).runTests(); // test connection manager

new _TestMoneroConnectionManager["default"]().runTests(); // test scratchpad

require("./Scratchpad");