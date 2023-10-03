// import test types
import {LibraryUtils} from "../../index";
import TestSampleCode from "./TestSampleCode";
import TestMoneroUtils from "./TestMoneroUtils";
import TestMoneroDaemonRpc from "./TestMoneroDaemonRpc";
import TestMoneroWalletKeys from "./TestMoneroWalletKeys";
import TestMoneroWalletFull from "./TestMoneroWalletFull";
import TestMoneroWalletRpc from "./TestMoneroWalletRpc";
import TestMoneroConnectionManager from "./TestMoneroConnectionManager";

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
