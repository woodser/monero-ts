const MoneroWallet = require("../main/js/wallet/MoneroWallet");

/**
 * Compares two wallets for equality using only on-chain data.
 * 
 * This test will sync the two wallets until their height is equal to guarantee equal state.
 * 
 * The RPC and JNI wallets are tested by default unless overriden by subclassing or using the setters.
 */
class TestMoneroWalletsEqual {
  
  //private static final Logger LOGGER = Logger.getLogger(TestMoneroWalletsEqual.class); // logger

  getWallet1() {
    return this.w1
  }
  
  setWallet1(w1) {
    this.w1 = w1;
    return this;
  }
  
  getWallet2() {
    return this.w2;
  }
  
  setWallet2(w2) {
    this.w2 = w2;
    return this;
  }
  
  async testWalletsEqualOnChain() {
    TestUtils.TX_POOL_WALLET_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync
    
    // default to rpc and jni wallets
    if (this.w1 === undefined) this.w1 = await TestUtils.getWalletRpc();
    if (this.w2 === undefined) this.w2 = await TestUtils.getWalletKeys();
    
    // wait for relayed txs associated with wallets to clear pool
    TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool([this.w1, this.w2]);
    
    // sync the wallets until same height
    while (await this.w1.getHeight() !== await this.w2.getHeight()) {
      this.w1.sync();
      this.w2.sync();
    }
    
    // test that wallets are equal based using only on-chain data
    assert.equal(await this.w1.getHeight(), await this.w2.getHeight());
    assert.equal(await this.w1.getMnemonic(), await this.w2.getMnemonic());
    assert.equal(await this.w1.getPrimaryAddress(), await this.w2.getPrimaryAddress());
    assert.equal(await this.w1.getPrivateViewKey(), await this.w2.getPrivateViewKey());
    assert.equal(await this.w1.getPrivateSpendKey(), await this.w2.getPrivateSpendKey());
    let txQuery = new MoneroTxQuery().setIsConfirmed(true);
    await testTxWalletsEqualOnChain(await this.w1.getTxs(txQuery), await this.w2.getTxs(txQuery));
    txQuery.setIncludeOutputs(true);
    await testTxWalletsEqualOnChain(await this.w1.getTxs(txQuery), await this.w2.getTxs(txQuery));  // fetch and compare outputs
    testAccountsEqualOnChain(await this.w1.getAccounts(true), await this.w2.getAccounts(true));
    assert.equal(await this.w1.getBalance(), await this.w2.getBalance());
    assert.equal(await this.w1.getUnlockedBalance(), await this.w2.getUnlockedBalance());
    let transferQuery = new MoneroTransferQuery().setTxQuery(new MoneroTxQuery().setIsConfirmed(true));
    await testTransfersEqualOnChain(await this.w1.getTransfers(transferQuery), await this.w2.getTransfers(transferQuery));
    let outputQuery = new MoneroOutputQuery().setTxQuery(new MoneroTxQuery().setIsConfirmed(true));
    await testOutputWalletsEqualOnChain(await this.w1.getOutputs(outputQuery), await this.w2.getOutputs(outputQuery));
  }
  
  async testAccountsEqualOnChain(accounts1, accounts2) {
    for (let i = 0; i < Math.max(accounts1.length, accounts2.length); i++) {
      if (i < accounts1.length && i < accounts2.length) {
        await testAccountsEqualOnChain(accounts1[i], accounts2[i]);
      } else if (i >= accounts1.length) {
        for (let j = i; j < accounts2.length; j++) {
          assert.equal(accounts2[j].getBalance(), new BigInteger(0));
          assert(accounts2[j].getSubaddresses().length >= 1);
          for (let subaddress of accounts2[j].getSubaddresses()) assert(!subaddress.isUsed());
        }
        return;
      } else {
        for (let j = i; j < accounts1.length; j++) {
          assert.equal(new BigInteger(0), accounts1[j].getBalance());
          assert(accounts1[j].getSubaddresses().length >= 1);
          for (let subaddress of accounts1[j].getSubaddresses()) assert(!subaddress.isUsed());
        }
        return;
      }
    }
  }
  
  async testAccountsEqualOnChain(account1, account2) {
    
    // nullify off-chain data for comparison
    let = account1.getSubaddresses();
    let subaddresses2 = account2.getSubaddresses();
    account1.setSubaddresses(undefined);
    account2.setSubaddresses(undefined);
    account1.setTag(undefined);
    account2.setTag(undefined);
    
    // test account equality
    assert.equal(account1, account2);
    await testSubaddressesEqualOnChain(subaddresses1, subaddresses2);
  }
  
  await testSubaddressesEqualOnChain(subaddresses1, subaddresses2) {
    for (let i = 0; i < Math.max(subaddresses1.length, subaddresses2.length); i++) {
      if (i < subaddresses1.length && i < subaddresses2.length) {
        await testSubaddressesEqualOnChain(subaddresses1[i], subaddresses2[i]);
      } else if (i >= subaddresses1.length) {
        for (let j = i; j < subaddresses2.length; j++) {
          assert.equal(new BigInteger(0), subaddresses2[j].getBalance());
          assert(!subaddresses2[j].isUsed());
        }
        return;
      } else {
        for (let j = i; j < subaddresses1.length; j++) {
          assert.equal(new BigInteger(0), subaddresses1[i].getBalance());
          assert(!subaddresses1[j].isUsed());
        }
        return;
      }
    }
  }
  
  async testSubaddressesEqualOnChain(subaddress1, subaddress2) {
    subaddress1.setLabel(undefined); // nullify off-chain data for comparison
    subaddress2.setLabel(undefined);
    assert.equal(subaddress1, subaddress2);
  }
  
  async testTxWalletsEqualOnChain(txs1, txs2) {
    
    // nullify off-chain data for comparison
    let allTxs = [];
    for (let tx1 of txs1) allTxs.push(tx1);
    for (let tx2 of txs2) allTxs.push(tx2);
    for (let tx of allTxs) {
      tx.setNote(undefined);
      if (tx.getOutgoingTransfer() !== undefined) {
        tx.getOutgoingTransfer().setAddresses(undefined);
      }
    }
    
    // compare txs
    assert.equal(txs1.length, txs2.length);
    for (let tx1 of txs1) {
      let found = false;
      for (let tx2 of txs2) {
        if (tx1.getId() === tx2.getId()) {
          
          // transfer destination info if known for comparison
          if (tx1.getOutgoingTransfer() !== undefined && tx1.getOutgoingTransfer().getDestinations() !== undefined) {
            if (tx2.getOutgoingTransfer() === undefined || tx2.getOutgoingTransfer().getDestinations() === undefined) transferDestinationInfo(tx1, tx2);
          } else if (tx2.getOutgoingTransfer() !== undefined && tx2.getOutgoingTransfer().getDestinations() !== undefined) {
            transferDestinationInfo(tx2, tx1);
          }
          
          // test tx equality
          assert.equal(tx1, tx2);
          found = true;
          
          // test block equality except txs to ignore order
          let blockTxs1 = tx1.getBlock().getTxs();
          let blockTxs2 = tx2.getBlock().getTxs();
          tx1.getBlock().setTxs();
          tx2.getBlock().setTxs();
          assert.equal(tx1.getBlock(), tx2.getBlock());
          tx1.getBlock().setTxs(blockTxs1);
          tx2.getBlock().setTxs(blockTxs2);
        }
      }
      assert(found);  // each tx must have one and only one match
    }
  }
  
  let transferDestinationInfo(src, tgt) {
    
    // fill in missing incoming transfers when sending from/to the same account
    if (src.getIncomingTransfers() !== undefined) {
      for (let inTransfer of src.getIncomingTransfers()) {
        if (inTransfer.getAccountIndex() === src.getOutgoingTransfer().getAccountIndex()) {
          tgt.getIncomingTransfers().push(inTransfer);
        }
      }
      Collections.sort(tgt.getIncomingTransfers(), new IncomingTransferComparator()); // TODO: sort this
    }
    
    // transfer info to outgoing transfer
    if (tgt.getOutgoingTransfer() === undefined) tgt.setOutgoingTransfer(src.getOutgoingTransfer());
    else {
      tgt.getOutgoingTransfer().setDestinations(src.getOutgoingTransfer().getDestinations());
      tgt.getOutgoingTransfer().setAmount(src.getOutgoingTransfer().getAmount());
      tgt.getOutgoingTransfer().setNumSuggestedConfirmations(GenUtils.reconcile(src.getOutgoingTransfer().getNumSuggestedConfirmations(), tgt.getOutgoingTransfer().getNumSuggestedConfirmations(), undefined, undefined, true));  // suggested confirmations can grow with amount
    }
  }
  
  async testTransfersEqualOnChain(transfers1, transfers2) {
    assert.equal(transfers1.length, transfers2.length);
    
    // test and collect transfers per transaction
    let txsTransfers1 = new Map();
    let txsTransfers2 = new Map();
    let lastHeight = undefined;
    let lastTx1 = undefined;
    let lastTx2 = undefined;
    for (let i = 0; i < transfers1.length; i++) {
      let transfer1 = transfers1[i];
      let transfer2 = transfers2[i];
      
      // transfers must have same height even if they don't belong to same tx (because tx ordering within blocks is not currently provided by wallet2)
      assert.equal(transfer1.getTx().getHeight(), transfer2.getTx().getHeight());
      
      // transfers must be in ascending order by height
      if (lastHeight === undefined) lastHeight = transfer1.getTx().getHeight();
      else assert(lastHeight <= transfer1.getTx().getHeight());
      
      // transfers must be consecutive per transaction
      if (lastTx1 !== transfer1.getTx()) {
        assert(!txsTransfers1.has(transfer1.getTx().getId()));  // cannot be seen before
        lastTx1 = transfer1.getTx();
      }
      if (lastTx2 !== transfer2.getTx()) {
        assertFalse(txsTransfers2.has(transfer2.getTx().getId()));  // cannot be seen before
        lastTx2 = transfer2.getTx();
      }
      
      // collect tx1 transfer
      List<MoneroTransfer> txTransfers1 = txsTransfers1.get(transfer1.getTx().getId());
      if (txTransfers1 === undefined) {
        txTransfers1 = new ArrayList<MoneroTransfer>();
        txsTransfers1.put(transfer1.getTx().getId(), txTransfers1);
      }
      txTransfers1.add(transfer1);
      
      // collect tx2 transfer
      List<MoneroTransfer> txTransfers2 = txsTransfers2.get(transfer2.getTx().getId());
      if (txTransfers2 === undefined) {
        txTransfers2 = new ArrayList<MoneroTransfer>();
        txsTransfers2.put(transfer2.getTx().getId(), txTransfers2);
      }
      txTransfers2.add(transfer2);
    }
    
    // compare collected transfers per tx for equality
    for (let txId : txsTransfers1.keySet()) {
      List<MoneroTransfer> txTransfers1 = txsTransfers1.get(txId);
      List<MoneroTransfer> txTransfers2 = txsTransfers2.get(txId);
      assert.equal(txTransfers1.length, txTransfers2.length);
      
      // normalize and compare transfers
      for (let i = 0; i < txTransfers1.length; i++) {
        MoneroTransfer transfer1 = txTransfers1[i];
        MoneroTransfer transfer2 = txTransfers2[i];
        
        // normalize outgoing transfers
        if (transfer1 instanceof MoneroOutgoingTransfer) {
          MoneroOutgoingTransfer ot1 = (MoneroOutgoingTransfer) transfer1;
          MoneroOutgoingTransfer ot2 = (MoneroOutgoingTransfer) transfer2;
    
          // transfer destination info if known for comparison
          if (ot1.getDestinations() !== undefined) {
            if (ot2.getDestinations() === undefined) transferDestinationInfo(ot1.getTx(), ot2.getTx());
          } else if (ot2.getDestinations() !== undefined) {
            transferDestinationInfo(ot2.getTx(), ot1.getTx());
          }
          
          // nullify other local wallet data
          ot1.setAddresses(undefined);
          ot2.setAddresses(undefined);
        }
        
        // normalize incoming transfers
        else {
          MoneroIncomingTransfer it1 = (MoneroIncomingTransfer) transfer1;
          MoneroIncomingTransfer it2 = (MoneroIncomingTransfer) transfer2;
          it1.setAddress(undefined);
          it2.setAddress(undefined);
        }
        
        // compare transfer equality
        assert.equal(transfer1, transfer2);
      }
    }
  }
  
  protected void testOutputWalletsEqualOnChain(List<MoneroOutputWallet> outputs1, List<MoneroOutputWallet> outputs2) {
    assert.equal(outputs1.length, outputs2.length);
    
    // test and collect outputs per transaction
    Map<String, List<MoneroOutputWallet>> txsOutputs1 = new HashMap<String, List<MoneroOutputWallet>>();
    Map<String, List<MoneroOutputWallet>> txsOutputs2 = new HashMap<String, List<MoneroOutputWallet>>();
    Long lastHeight = undefined;
    MoneroTxWallet lastTx1 = undefined;
    MoneroTxWallet lastTx2 = undefined;
    for (let i = 0; i < outputs1.length; i++) {
      MoneroOutputWallet output1 = outputs1[i];
      MoneroOutputWallet output2 = outputs2[i];
      
      // outputs must have same height even if they don't belong to same tx (because tx ordering within blocks is not currently provided by wallet2)
      assert.equal((long) output1.getTx().getHeight(), (long) output2.getTx().getHeight());
      
      // outputs must be in ascending order by height
      if (lastHeight === undefined) lastHeight = output1.getTx().getHeight();
      else assert(lastHeight <= output1.getTx().getHeight());
      
      // outputs must be consecutive per transaction
      if (lastTx1 !== output1.getTx()) {
        assert(!txsOutputs1.has(output1.getTx().getId()));  // cannot be seen before
        lastTx1 = output1.getTx();
      }
      if (lastTx2 !== output2.getTx()) {
        assert(!txsOutputs2.has(output2.getTx().getId()));  // cannot be seen before
        lastTx2 = output2.getTx();
      }
      
      // collect tx1 output
      let txOutputs1 = txsOutputs1.get(output1.getTx().getId());
      if (txOutputs1 === undefined) {
        txOutputs1 = [];
        txsOutputs1.put(output1.getTx().getId(), txOutputs1);
      }
      txOutputs1.add(output1);
      
      // collect tx2 output
      List<MoneroOutputWallet> txOutputs2 = txsOutputs2.get(output2.getTx().getId());
      if (txOutputs2 === undefined) {
        txOutputs2 = new ArrayList<MoneroOutputWallet>();
        txsOutputs2.put(output2.getTx().getId(), txOutputs2);
      }
      txOutputs2.add(output2);
    }
    
    // compare collected outputs per tx for equality
    for (let txId of txsOutputs1.keySet()) {
      let txOutputs1 = txsOutputs1.get(txId);
      let txOutputs2 = txsOutputs2.get(txId);
      assert.equal(txOutputs1.length, txOutputs2.length);
      
      // normalize and compare outputs
      for (let i = 0; i < txOutputs1.length; i++) {
        let output1 = txOutputs1[i];
        let output2 = txOutputs2[i];
        assert.equal(output1.getTx().getId(), output2.getTx().getId());
        assert.equal(output1, output2);
      }
    }
  }
}

module.exports = TestMoneroWalletsEqual;