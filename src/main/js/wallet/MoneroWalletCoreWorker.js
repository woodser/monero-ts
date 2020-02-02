/**
 * Web worker to run a core wallet managed by messages.
 * 
 * This file must be copied to the web app root.
 */
onmessage = async function(e) {
  await self.initOneTime();
  self[e.data[0]].apply(null, e.data.slice(1));
}

self.initOneTime = async function() {
  if (!self.isInitialized) {
    self.isInitialized = true;
    console.log("WORKER loading scripts and module");
    self.importScripts('monero-javascript-wasm.js');
    self.importScripts('worker_imports.js');
    await MoneroUtils.loadWasmModule();
    console.log("done loading scripts and module");
  }
}

self.createWalletRandom = async function(password, networkType, daemonUriOrConfig, language) {
  let daemonConnection = new MoneroRpcConnection(daemonUriOrConfig);
  self.wallet = await MoneroWalletCore.createWalletRandom("", password, networkType, daemonConnection, language);
  postMessage(["onCreateWalletRandom"]);
}

self.createWalletFromMnemonic = async function(password, networkType, mnemonic, daemonUriOrConfig, restoreHeight, seedOffset) {
  let daemonConnection = new MoneroRpcConnection(daemonUriOrConfig);
  self.wallet = await MoneroWalletCore.createWalletFromMnemonic("", password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset);
  postMessage(["onCreateWalletFromMnemonic"]);
}

self.getMnemonic = async function() {
  postMessage(["onGetMnemonic", await self.wallet.getMnemonic()]);
}

self.getAddress = async function(accountIdx, subaddressIdx) {
  postMessage(["onGetAddress", await self.wallet.getAddress(accountIdx, subaddressIdx)]);
}

self.getRestoreHeight = async function() {
  postMessage(["onGetRestoreHeight", await self.wallet.getRestoreHeight()]);
}

self.getHeight = async function() {
  postMessage(["onGetHeight", await self.wallet.getHeight()]);
}

self.addListener = async function(listenerId) {
  
  /**
   * Internal listener to bridge notifications to external listeners.
   * 
   * TODO: MoneroWalletListener is not defined until scripts imported
   */
  class WalletWorkerHelperListener extends MoneroWalletListener {
    
    constructor(id, worker) {
      super();
      this.id = id;
      this.worker = worker;
    }
    
    getId() {
      return this.id;
    }
    
    onSyncProgress(height, startHeight, endHeight, percentDone, message) {
      this.worker.postMessage(["onSyncProgress_" + this.getId(), height, startHeight, endHeight, percentDone, message]);
    }

    onNewBlock(height) { 
      this.worker.postMessage(["onNewBlock_" + this.getId(), height]);
    }

    onOutputReceived(output) {
      let block = output.getTx().getBlock();
      if (block === undefined) block = new MoneroBlock().setTxs([output.getTx()]);
      this.worker.postMessage(["onOutputReceived_" + this.getId(), block.toJson()]);  // serialize from root block
    }
    
    onOutputSpent(output) {
      let block = output.getTx().getBlock();
      if (block === undefined) block = new MoneroBlock().setTxs([output.getTx()]);
      this.worker.postMessage(["onOutputSpent_" + this.getId(), block.toJson()]);     // serialize from root block
    }
  }
  
  let listener = new WalletWorkerHelperListener(listenerId, self);
  if (!self.listeners) self.listeners = [];
  self.listeners.push(listener);
  await self.wallet.addListener(listener);
}

self.removeListener = async function(listenerId) {
  for (let i = 0; i < self.listeners.length; i++) {
    if (self.listeners[i].getId() !== listenerId) continue;
    await self.wallet.removeListener(self.listeners[i]);
    self.listeners.splice(i, 1);
    return;
  }
  throw new MoneroError("Listener is not registered to wallet");
}

self.sync = async function() {
  postMessage(["onSync", await self.wallet.sync()]);
}

self.startSyncing = async function() {
  try {
    await self.wallet.startSyncing()
    postMessage(["onStartSyncing"]);
  } catch (e) {
    assert(e.message);
    postMessage(["onStartSyncing", e.message]);
  }
}

self.stopSyncing = async function() {
  postMessage(["onStopSyncing", await self.wallet.stopSyncing()]);
}

self.getBalance = async function() {
  postMessage(["onGetBalance", (await self.wallet.getBalance()).toString()]);
}

self.getUnlockedBalance = async function() {
  postMessage(["onGetUnlockedBalance", (await self.wallet.getUnlockedBalance()).toString()]);
}

// TODO: easier or more efficient way than serializing from root blocks?
self.getTxs = async function(blockJsonQuery) {
  let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0];
  let txs = await self.wallet.getTxs(query);
  
  // collect unique blocks to preserve model relationships as trees (based on monero_wasm_bridge.cpp::get_txs)
  let unconfirmedBlock = undefined;
  let blocks = [];
  let seenBlocks = new Set();
  for (let tx of txs) {
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new MoneroBlock().setTxs([]);
      tx.setBlock(unconfirmedBlock);
      unconfirmedBlock.getTxs().push(tx);
    }
    if (!seenBlocks.has(tx.getBlock())) {
      seenBlocks.add(tx.getBlock());
      blocks.push(tx.getBlock());
    }
  }
  
  // serialize blocks to json
  for (let i = 0; i < blocks.length; i++) blocks[i] = blocks[i].toJson();
  
  // wrap and serialize response
  postMessage(["onGetTxs", JSON.stringify({blocks: blocks})]);
}

self.sendSplit = async function(requestOrAccountIndex, address, amount, priority) {
  if (typeof requestOrAccountIndex === "object") requestOrAccountIndex = new MoneroSendRequest(requestOrAccountIndex);
  postMessage(["onSendSplit", (await self.wallet.sendSplit(requestOrAccountIndex, address, amount, priority)).toJson()]);
}