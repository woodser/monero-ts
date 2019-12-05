/**
 * Sample browser application which uses a JavaScript library to interact
 * with a Monero daemon using RPC and a Monero wallet using RPC and WASM
 * bindings.
 */

"use strict"

const MoneroDaemonRpc = require("../src/main/js/daemon/MoneroDaemonRpc");
const MoneroWalletRpc = require("../src/main/js/wallet/MoneroWalletRpc");

// start the application
startApp();
async function startApp() {
  console.log("Starting app...");
  
  // demonstrate using c++ utilities through webassembly
  const MoneroCppUtils = await require("../src/main/js/utils/MoneroCppUtils")();
  let json = { msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' +
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
      'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n'};
  let binary = MoneroCppUtils.jsonToBinary(json);
  assert(binary);
  let json2 = MoneroCppUtils.binaryToJson(binary);
  assert.deepEqual(json2, json);
  console.log("C++ utils working");
  
  // import keys-only wallet which exports a promise in order to load the WebAssembly module
  const MoneroWalletKeys = await require("../src/main/js/wallet/MoneroWalletKeys")();
  
  // demonstrate keys-only wallet
  let walletKeys = await MoneroWalletKeys.createWalletRandom(MoneroNetworkType.STAGENET, "English");
  console.log("Keys-only wallet random mnemonic: " + await walletKeys.getMnemonic());
  let mnemonic = "megabyte ghetto syllabus opposite firm january velvet kennel often bugs luggage nucleus volcano fainted ripped biology firm sushi putty swagger dove obedient unnoticed washing swagger";
  walletKeys = await MoneroWalletKeys.createWalletFromMnemonic(MoneroNetworkType.STAGENET, mnemonic);
  console.log("Keys-only wallet imported mnemonic: " + await walletKeys.getMnemonic());
  console.log("Keys-only wallet imported address: " + await walletKeys.getPrimaryAddress());
  
//  // import wasm wallet which exports a promise in order to load the WebAssembly module
//  const MoneroWalletWasm = await require("../src/main/js/wallet/MoneroWalletWasm")();
//  
//  let firstReceiveHeight = 453289;
//  
//  // demonstrate wasm wallet
//  let daemonConnection = new MoneroRpcConnection({uri: "http://localhost:38081", user: "superuser", pass: "abctesting123"});  // TODO: support 3 strings, "pass" should probably be renamed to "password" 
//  let walletWasm = await MoneroWalletWasm.createWalletRandom("", "supersecretpassword123", MoneroNetworkType.STAGENET, daemonConnection, "English");
//  console.log("Created random wallet!");
//  walletWasm = await MoneroWalletWasm.createWalletFromMnemonic("", "supersecretpassword123", MoneroNetworkType.STAGENET, mnemonic, daemonConnection, firstReceiveHeight);
//  console.log("Restored wallet from seed!");
//  let result = await walletWasm.sync();
//  console.log("index.js received sync result");
//  console.log(result);
//  let height = await walletWasm.getHeight();
//  console.log("index.js received height result");
//  console.log(result);
//  console.log("WASM wallet created");
//  walletWasm.dummyMethod();
  
  // connect to monero-daemon-rpc
  let daemon = new MoneroDaemonRpc({uri: "http://localhost:38081", user: "superuser", pass: "abctesting123"});
  console.log("Daemon height: " + await daemon.getHeight());
  
  // connect to monero-wallet-rpc
  let walletRpc = new MoneroWalletRpc({uri: "http://localhost:38083", user: "rpc_user", pass: "abc123"});
  console.log("Wallet rpc mnemonic: " + await walletRpc.getMnemonic());
  console.log("Wallet rpc balance: " + await walletRpc.getBalance());
  
  // sync the wallet
//  await wallet.sync(undefined, function(progress) {
//    console.log(progress.percent);
//  });
//  console.log("Done syncing?");
  console.log("Done");
}