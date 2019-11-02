/**
 * Sample browser application which uses a JavaScript library to interact
 * with a Monero daemon using RPC and a Monero wallet using RPC and WASM
 * bindings.
 */

"use strict"

// import what you want to use
const MoneroDaemonRpc = require("../src/main/js/daemon/MoneroDaemonRpc");
const MoneroWalletRpc = require("../src/main/js/wallet/MoneroWalletRpc");
const MoneroWalletLocal = require("../src/main/js/wallet/MoneroWalletLocal");

// start the application
startApp();
async function startApp() {
  console.log("Starting app...");
  
  // import wasm wallet which exports a promise in order to load the WebAssembly module
  const MoneroWalletWasm = await require("../src/main/js/wallet/MoneroWalletWasm")();
  
  let mnemonic = "hefty value later extra artistic firm radar yodel talent future fungal nutshell because sanity awesome nail unjustly rage unafraid cedar delayed thumbs comb custom sanity";
  //let firstReceiveHeight = 383338;
  let firstReceiveHeight = 440000;
  
  // demonstrate wasm wallet
  //let walletWasm = await MoneroWalletWasm.createWalletRandom("", "supersecretpassword123", 2, "http://localhost:38081", "superuser", "abctesting123", "English");  // TODO: proper network type
  let walletWasm = await MoneroWalletWasm.createWalletFromMnemonic("", "supersecretpassword123", 2, mnemonic, "http://localhost:38081", "superuser", "abctesting123", firstReceiveHeight);  // TODO: proper network type
  let result = await walletWasm.sync();
  console.log("index.js received sync result");
  console.log(result);
  let height = await walletWasm.getHeight();
  console.log("index.js received height result");
  console.log(result);
  console.log("WASM wallet created");
  walletWasm.dummyMethod();
  
  // demonstrate using core utilities through web assembly
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
  MoneroCppUtils.dummyMethod(JSON.stringify(json));
  let binary = MoneroCppUtils.jsonToBinary(json);
  assert(binary);
  let json2 = MoneroCppUtils.binaryToJson(binary);
  assert.deepEqual(json2, json);
  console.log("Yep they were equal.");
  
  // connect to monero-daemon-rpc
  let daemon = new MoneroDaemonRpc({uri: "http://localhost:38081", user: "superuser", pass: "abctesting123"});
  console.log("Daemon height: " + await daemon.getHeight());
  
  // connect to monero-wallet-rpc
  let walletRpc = new MoneroWalletRpc({uri: "http://localhost:38083", user: "rpc_user", pass: "abc123"});
  console.log("Wallet rpc mnemonic: " + await walletRpc.getMnemonic());
  console.log("Wallet rpc balance: " + await walletRpc.getBalance());
  
//  // create a wallet from mnemonic using local wasm bindings
//  let mnemonic = "nagged giddy virtual bias spying arsenic fowls hexagon oars frying lava dialect copy gasp utensils muffin tattoo ritual exotic inmate kisses either sprig sunken sprig";
//  let primaryAddress = "59aZULsUF3YNSKGiHz4JPMfjGYkm1S4TB3sPsTr3j85HhXb9crZqGa7jJ8cA87U48kT5wzi2VzGZnN2PKojEwoyaHqtpeZh";  // just for reference
//  let walletLocal = new MoneroWalletLocal({daemon: daemon, mnemonic: mnemonic});
//  console.log("Local wallet address: " + await walletLocal.getPrimaryAddress());
//  console.log("Local wallet height: " + await walletLocal.getHeight());
//  if (primaryAddress !== await walletLocal.getPrimaryAddress()) throw "Addresses do not match";
  
  // sync the wallet
//  await wallet.sync(undefined, function(progress) {
//    console.log(progress.percent);
//  });
//  console.log("Done syncing?");
  console.log("Done");
}