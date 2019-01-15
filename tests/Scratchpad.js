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
    
    // fetch vouts
//    let vouts = await wallet.getVouts({accountIndex: 0, subaddressIndex: 2});
//    for (let vout of vouts) {
//      console.log(vout.toString());
//    }
    
    // fetch transactions
    let txId = "af88ea62c1f0d439641f90f634d5bf5a6441170b35a36e53d52f4a4598df5682";
    let txs = await wallet.getTxs({txId: "a8429a20b173b119ffde6d3a0b3ebf666977f669cec1c5d23e879b69b553a37e", getVouts: true});
    for (let tx of txs) {
      if (tx.getVouts() === undefined) {
        console.log(tx.toString());
        return;
      }
      
      console.log(tx.getVouts() ? tx.getVouts().length : "N/A");
      
//      if (tx.getId() === txId) {
//        console.log(tx.toString());
//      }
    }
    
    
    // fetch transfers

    
//    for (let subaddress of await wallet.getSubaddresses(0)) {
//      let transfers = 
//      for (let transfer of transfers) {
//        assert.equal(txId, transfer.getTx().getId());
//        console.log(transfer.getTx().toString());
//      }
//    }
    
    
    // fetch vouts
    
//    let vouts = await wallet.getVouts({txId: "31564d4ccc63a7c9c118cac8ddf95f418392a57f6d7c41c461d874dc7571add9", accountIndex: 0});
//    console.log(vouts.length);
//    let sum = new BigInteger(0);
//    for (let vout of vouts) {
//      //if (vout.getKeyImage() === "3cd10eeb2d444e0fdb4e45312d841b2cbf153274e5acceb399043848c76f6d80") console.log(vout.getTx().toString());
//      console.log(vout.toString());
//      sum = sum.add(vout.getAmount());
//    }
//    console.log(sum.toString());
    
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