const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")
const TestUtils = require("./TestUtils");
const MoneroRpc = require("../src/rpc/MoneroRpc");
const MoneroTransfer = require("../src/wallet/model/MoneroTransfer");
const MoneroTxFilter = require("../src/wallet/filters/MoneroTxFilter");
const MoneroSendConfig = require("../src/wallet/model/MoneroSendConfig");

describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon and wallet
    let daemon = TestUtils.getDaemonRpc();
    let wallet = TestUtils.getWalletRpc();
    await TestUtils.initWalletRpc();
    
    
//    try { await wallet.startMining(8, false, true); }
//    catch (e) { }
//    await wallet.stopMining();
//    await daemon.stopMining();
//    await wallet.rescanBlockchain();
//    await wallet.rescanSpent();
    
    
    // fetch transfers
    let txId = "acbb642acbe51963b881aa97f7d99e25c4425cc5cb1a6c23130fc37250467afc";
    let transfers = await wallet.getTransfers({accountIndex: 0, isIncoming: true, txId: txId});
    for (let transfer of transfers) {
      assert.equal(txId, transfer.getTx().getId());
      console.log(transfer.getTx().toString());
    }
    
//    // fetch txs
//    //filter.setAccountIndex(0);
//    //filter.setSubaddressIndices([0]);
//    //filter.setFetchVouts(true);
//    let txs = new Set();
//    let transfers = await wallet.getTransfers({accountIndex: 0, subaddressIndex: 2, debugTxId: txId});
//    for (let transfer of transfers) {
//      txs.add(transfer.getTx());
//    }
//    txs = Array.from(txs);
//    for (let tx of txs) {
//      if (tx.getId() === txId) console.log(tx.toString());
//    }
    
    // fetch vouts
//    let vouts = await wallet.getVouts();
//    console.log(vouts[0].toString());
//    console.log(vouts[0].getTx().toString());
    
    // send tx
//  let address1 = (await wallet.getSubaddress(1, 0)).getAddress();
//  let transfer1 = new MoneroTransfer(address1, new BigInteger(2).multiply(TestUtils.MAX_FEE));
//  let transfer2 = new MoneroTransfer(address1, new BigInteger(3).multiply(TestUtils.MAX_FEE));
//  let sendConfig = new MoneroSendConfig();
//  sendConfig.setTransfers([transfer1, transfer2]);
//  sendConfig.setAccountIndex(0);
//  let tx = await wallet.send(sendConfig);
//  console.log(tx.toString());
    
//    
//    // use direct rpc interface to
//    let rpc = new MoneroRpc({
//      uri: "http://localhost:38083",
//      user: "rpc_user",
//      pass: "abc123",
//    });
//    let resp = await rpc.sendJsonRequest("get_transfer_by_txid", {txid: "5d6218a24a81de3c7eb4474b3452ef6b81aea84dda930a129f807f80feac34f2"});
//    console.log(resp);
  });
});