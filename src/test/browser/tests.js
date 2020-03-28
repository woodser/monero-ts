// TODO: combine with ../TestAll.js

// import library models
require("../../../index.js");

// import test types
require("../utils/TestUtilsModule")();
const TestMoneroDaemonRpc = require("../TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("../TestMoneroWalletRpc");
const TestMoneroWalletKeys = require("../TestMoneroWalletKeys");
const TestMoneroWalletCore = require("../TestMoneroWalletCore");

/**
 * Run tests when document ready.
 */
document.addEventListener("DOMContentLoaded", function() {
  runTests();
});

/**
 * Run Monero tests.
 */
function runTests() {
  
  // mocha setup
  mocha.setup({
    ui: 'bdd',
    timeout: 3000000
  });
  mocha.checkLeaks();
  
  // test config
  TestUtils.PROXY_TO_WORKER = true; // proxy test wallet and daemon to worker to not lock main browser thread
  TestUtils.FS = require('memfs');  // use in-memory file system needed for tests since running in the browser
  
  // test sample code for readme
  new TestSampleCode().runTests();
  
  // test utilitiles
  new TestMoneroUtils().runTests();
  
  // test daemon rpc
  new TestMoneroDaemonRpc({
    liteMode: true,          // skips some thorough but lengthy tests
    testNonRelays: true,
    testRelays: true,         // creates and relays outgoing txs
    testNotifications: true,
  }).runTests();
  
  // test wallet rpc
  new TestMoneroWalletRpc({
    liteMode: false, // skips some lengthy but detailed tests
    testNonRelays: true,
    testRelays: true,
    testNotifications: false,
    testResets: false
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
    testNotifications: true,
  }).runTests();
  
  // run tests
  mocha.run();
}