# Multisig wallets

The following is an example of creating multisig wallets.

For a full example of creating and sending funds from multisig wallets, see [this test](https://github.com/monero-ecosystem/monero-javascript/blob/80d89aae145d675c61d2a7f4c4769a749b5984f7/src/test/TestMoneroWalletCommon.js#L3549).

```javascript
// create multisig wallets which require 3 out of 5 participants to send funds
let M = 3;
let N = 5;

// create participating wallets using RPC or WebAssembly
const monerojs = require("monero-javascript");
let wallets = []
for (let i = 0; i < N; i++) {
  wallets.push(await monerojs.createWalletFull({
    path: "./test_wallets/multisig_participant_" + (i + 1),
    password: "supersecretpassword123",
    networkType: "stagenet"
  }));
}

// prepare and collect multisig hex from each participant
let preparedMultisigHexes = []
for (let wallet of wallets) preparedMultisigHexes.push(await wallet.prepareMultisig());

// make each wallet multsig and collect results
let madeMultisigHexes = [];
for (let i = 0; i < wallets.length; i++) {
  
  // collect prepared multisig hexes from wallet's peers
  let peerMultisigHexes = [];
  for (let j = 0; j < wallets.length; j++) if (j !== i) peerMultisigHexes.push(preparedMultisigHexes[j]);

  // make wallet multisig and collect result hex
  let result = await wallets[i].makeMultisig(peerMultisigHexes, M, TestUtils.WALLET_PASSWORD);
  madeMultisigHexes.push(result.getMultisigHex());
}

// if wallet is not N/N, exchange multisig keys N-M times
if (M !== N) {
  let multisigHexes = madeMultisigHexes;
  for (let i = 0; i < N - M; i++) {
    
    // exchange multisig keys among participants and collect results for next round if applicable
    let resultMultisigHexes = [];
    for (let wallet of wallets) {
      
      // import the multisig hex of other participants and collect results
      let result = await wallet.exchangeMultisigKeys(multisigHexes, TestUtils.WALLET_PASSWORD);
      resultMultisigHexes.push(result.getMultisigHex());
    }
    
    // use resulting multisig hex for next round of exchange if applicable
    multisigHexes = resultMultisigHexes;
  }
}

// wallets are now multisig
for (let wallet of wallets) {
  let primaryAddress = await wallet.getAddress(0, 0);
  MoneroUtils.validateAddress(primaryAddress, await wallet.getNetworkType());
  let info = await wallet.getMultisigInfo();
  assert(info.isMultisig());
  assert(info.isReady());
  assert.equal(info.getThreshold(), M);
  assert.equal(info.getNumParticipants(), N);
  await wallet.close();
}
```