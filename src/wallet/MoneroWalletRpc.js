const assert = require("assert");
const BigInteger = require("../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const GenUtils = require("../utils/GenUtils");
const MoneroUtils = require("../utils/MoneroUtils");
const MoneroRpc = require("../rpc/MoneroRpc");
const MoneroWallet = require("./MoneroWallet");
const MoneroIntegratedAddress = require("./model/MoneroIntegratedAddress");
const MoneroAccount = require("./model/MoneroAccount");
const MoneroSubaddress = require("./model/MoneroSubaddress");
const MoneroTxFilter = require("./model/MoneroTxFilter");
const MoneroTxWallet = require("./model/MoneroTxWallet");
const MoneroPayment = require("./model/MoneroPayment");
const MoneroSendConfig = require("./model/MoneroSendConfig");
const MoneroCheckTx = require("./model/MoneroCheckTx");
const MoneroCheckReserve = require("./model/MoneroCheckReserve");

/**
 * Implements a Monero wallet using monero-wallet-rpc.
 */
class MoneroWalletRpc extends MoneroWallet {
  
  /**
   * Constructs the wallet rpc instance.
   * 
   * @param config is the rpc configuration // TODO: config default and validation
   */
  constructor(config) {
    super();
    
    // assign config
    this.config = Object.assign({}, config);
    
    // initialize rpc if not given
    if (!this.config.rpc) this.config.rpc = new MoneroRpc(config);
    
    // initialize address cache to avoid unecessary requests for addresses
    this.addressCache = {};
  }
  
  async getHeight() {
    return (await this.config.rpc.sendJsonRequest("get_height")).height;
  }
  
  async getMnemonic() {
    let resp = await this.config.rpc.sendJsonRequest("query_key", { key_type: "mnemonic" });
    return resp.key;
  }
  
  async getPrivateViewKey() {
    let resp = await this.config.rpc.sendJsonRequest("query_key", { key_type: "view_key" });
    return resp.key;
  }
  
  async getLanguages() {
    return (await this.config.rpc.sendJsonRequest("get_languages")).languages;
  }
  
  async getPrimaryAddress() {
    return (await this.config.rpc.sendJsonRequest("get_address", { account_index: 0, address_index: 0 })).address;
  }
  
  async getIntegratedAddress(paymentId) {
    let integratedAddressStr = (await this.config.rpc.sendJsonRequest("make_integrated_address", {payment_id: paymentId})).integrated_address;
    return await this.decodeIntegratedAddress(integratedAddressStr);
  }
  
  async decodeIntegratedAddress(integratedAddress) {
    let resp = await this.config.rpc.sendJsonRequest("split_integrated_address", {integrated_address: integratedAddress});
    return new MoneroIntegratedAddress(resp.standard_address, resp.payment_id, integratedAddress);
  }
  
  // TODO: test and support start_height parameter
  async sync(startHeight, endHeight, onProgress) {
    assert(endHeight === undefined, "Monero Wallet RPC does not support syncing to an end height");
    assert(onProgress === undefined, "Monero Wallet RPC does not support reporting sync progress");
    return await this.config.rpc.sendJsonRequest("refresh");
  }
  
  async isMultisigImportNeeded() {
    let resp = await this.config.rpc.sendJsonRequest("get_balance");
    return resp.multisig_import_needed === true;
  }
  
  async getBalance() {
    let balance = new BigInteger(0);
    for (let account of await this.getAccounts()) {
      balance = balance.add(account.getBalance());
    }
    return balance;
  }
  
  async getUnlockedBalance() {
    let unlockedBalance = new BigInteger(0);
    for (let account of await this.getAccounts()) {
      unlockedBalance = unlockedBalance.add(account.getUnlockedBalance());
    }
    return unlockedBalance;
  }
  
  async getAccounts(includeSubaddresses, tag) {
    
    // fetch accounts
    let resp = await this.config.rpc.sendJsonRequest("get_accounts", {tag: tag});
    
    // build account objects
    let accounts = [];
    for (let respAccount of resp.subaddress_accounts) {
      let accountIdx = respAccount.account_index;
      let balance = new BigInteger(respAccount.balance);
      let unlockedBalance = new BigInteger(respAccount.unlocked_balance);
      let primaryAddress = respAccount.base_address;
      let label = respAccount.label;
      let account = new MoneroAccount(accountIdx, primaryAddress, label, balance, unlockedBalance);
      if (includeSubaddresses) account.setSubaddresses(await this.getSubaddresses(accountIdx));
      accounts.push(account);
    }
    
    // return accounts
    return accounts;
  }
  
  async getAccount(accountIdx, includeSubaddresses) {
    assert(accountIdx >= 0);
    for (let account of await this.getAccounts()) {
      if (account.getIndex() === accountIdx) {
        if (includeSubaddresses) account.setSubaddresses(await this.getSubaddresses(accountIdx));
        return account;
      }
    }
    throw new Exception("Account with index " + accountIdx + " does not exist");
  }

  async createAccount(label) {
    let resp = await this.config.rpc.sendJsonRequest("create_account", {label: label});
    return new MoneroAccount(resp.account_index, resp.address, label, new BigInteger(0), new BigInteger(0));
  }

  async getSubaddresses(accountIdx, subaddressIndices) {
    
    // fetch subaddresses
    let params = {};
    params.account_index = accountIdx;
    if (subaddressIndices) params.address_index = GenUtils.listify(subaddressIndices);
    let resp = await this.config.rpc.sendJsonRequest("get_address", params);
    
    // initialize subaddresses
    let subaddresses = [];
    for (let respAddress of resp.addresses) {
      let subaddress = new MoneroSubaddress();
      subaddresses.push(subaddress);
      subaddress.setAccountIndex(accountIdx);
      subaddress.setSubaddressIndex(respAddress.address_index);
      subaddress.setLabel(respAddress.label);
      subaddress.setAddress(respAddress.address);
      subaddress.setIsUsed(respAddress.used);
      
      // set defaults
      subaddress.setBalance(new BigInteger(0));
      subaddress.setUnlockedBalance(new BigInteger(0));
      subaddress.setNumUnspentOutputs(0);
    }
    
    // fetch and initialize subaddress balances
    resp = await this.config.rpc.sendJsonRequest("get_balance", params);
    let respSubaddresses = resp.per_subaddress;
    if (respSubaddresses) {
      for (let respSubaddress of respSubaddresses) {
        let subaddressIdx = respSubaddress.address_index;
        for (let subaddress of subaddresses) {
          if (subaddressIdx !== subaddress.getSubaddressIndex()) continue; // find matching subaddress
          assert.equal(subaddress.getAddress(), respSubaddress.address);
          if (respSubaddress.balance !== undefined) subaddress.setBalance(new BigInteger(respSubaddress.balance));
          if (respSubaddress.unlocked_balance !== undefined) subaddress.setUnlockedBalance(new BigInteger(respSubaddress.unlocked_balance));
          subaddress.setNumUnspentOutputs(respSubaddress.num_unspent_outputs);
        }
      }
    }
    
    // cache addresses
    let subaddressMap = this.addressCache[accountIdx];
    if (!subaddressMap) {
      subaddressMap = {};
      this.addressCache[accountIdx] = subaddressMap;
    }
    for (let subaddress of subaddresses) {
      subaddressMap[subaddress.getSubaddressIndex()] = subaddress.getAddress();
    }
    
    // return results
    return subaddresses;
  }

  async getSubaddress(accountIdx, subaddressIdx) {
    assert(accountIdx >= 0);
    assert(subaddressIdx >= 0);
    return (await this.getSubaddresses(accountIdx, subaddressIdx))[0];
  }

  async createSubaddress(accountIdx, label) {
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest("create_address", {account_index: accountIdx, label: label});
    
    // build subaddress object
    let subaddress = new MoneroSubaddress();
    subaddress.setAccountIndex(accountIdx);
    subaddress.setSubaddressIndex(resp.address_index);
    subaddress.setAddress(resp.address);
    subaddress.setLabel(label ? label : "");
    subaddress.setBalance(new BigInteger(0));
    subaddress.setUnlockedBalance(new BigInteger(0));
    subaddress.setNumUnspentOutputs(0);
    subaddress.setIsUsed(false);
    return subaddress;
  }

  // TODO: confirm this is using cache as expected
  async getAddress(accountIdx, subaddressIdx) {
    let subaddressMap = this.addressCache[accountIdx];
    if (!subaddressMap) {
      await this.getSubaddresses(accountIdx);             // cache's all addresses at this account
      return this.getAddress(accountIdx, subaddressIdx);  // recursive call uses cache
    }
    let address = subaddressMap[subaddressIdx];
    if (!address) {
      await this.getSubaddresses(accountIdx);             // cache's all addresses at this account
      return this.getAddress(accountIdx, subaddressIdx);  // recursive call uses cache
    }
    return address;
  }
  
  async getTxs(filterOrAccountIdx, subaddressIdx) {
    
    // validate and standardize inputs to filter
    let filter;
    if (filterOrAccountIdx instanceof MoneroTxFilter) {
      assert(subaddressIdx === undefined, "Cannot specify subaddress index if first parameter is MoneroTxFilter");
      filter = filterOrAccountIdx;
    } else if (filterOrAccountIdx >= 0 || filterOrAccountIdx === undefined) {
      filter = new MoneroTxFilter();
      filter.setAccountIndex(filterOrAccountIdx);
      if (subaddressIdx !== undefined) {
        assert(subaddressIdx >= 0, "Subaddress must be >= 0 but was " + subaddressIdx);
        filter.setSubaddressIndices([subaddressIdx]);
      }
    } else throw new Error("First parameter must be MoneroTxFilter or account index >= 0 but was " + filterOrAccountIdx);
    
    // stores merged txs across calls
    let txs = [];
    
    // determine account and subaddress indices to be queried
    let indices = new Map();
    if (filter.getAccountIndex() !== undefined) {
      indices.set(filter.getAccountIndex(), filter.getSubaddressIndices() ? GenUtils.copyArray(filter.getSubaddressIndices()) : await this._getSubaddressIndices(filter.getAccountIndex()));
    } else {
      if (filter.getSubaddressIndices() !== undefined) throw new Error("Filter specifies subaddress indices but not an account index");
      indices = await this._getAllAccountAndSubaddressIndices();
    }
    
    // build common params for get_transfers
    let params = {};
    params.in = filter.getIsIncoming() !== false && filter.getIsConfirmed() !== false;
    params.out = filter.getIsOutgoing() !== false && filter.getIsConfirmed() !== false;
    params.pool = filter.getIsIncoming() !== false && filter.getInTxPool() !== false;
    params.pending = filter.getIsOutgoing() !== false && filter.getInTxPool() !== false;
    params.failed = filter.getIsOutgoing() !== false && filter.getIsFailed() !== false;
    params.filter_by_height = filter.getMinHeight() !== undefined || filter.getMaxHeight() !== undefined;
    if (filter.getMinHeight() !== undefined) params.min_height = filter.getMinHeight();
    if (filter.getMaxHeight() !== undefined) params.max_height = filter.getMaxHeight();
    
    // get transactions using get_transfers
    for (let accountIdx of indices.keys()) {
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.config.rpc.sendJsonRequest("get_transfers", params);
      for (let key of Object.keys(resp)) {
        for (let rpcTx of resp[key]) {
          let tx = MoneroWalletRpc._buildTxWallet(rpcTx);
          if (tx.getIsIncoming() && tx.getIsConfirmed()) {  // prevent duplicates when populated by incoming_transfers  // TODO (monero-wallet-rpc): merge payments when incoming txs work (https://github.com/monero-project/monero/issues/4500)
            tx.setTotalAmount(new BigInteger(0));
            tx.setPayments(undefined);
          }
          MoneroWalletRpc._addTx(txs, tx, false);
        }
      }
    }

    // get incoming transactions
    if (filter.getIsIncoming() !== false) {

      // get transactions using `incoming_transfers`
      params = {};
      params.transfer_type = "all"; // TODO: suppport all | available | unavailable 'types' which is different from MoneroTxType
      for (let accountIdx of indices.keys()) {
        params.account_index = accountIdx;
        params.subaddr_indices = filter.getSubaddressIndices(); // null subaddr_indices will fetch all incoming_transfers
        let resp = await this.config.rpc.sendJsonRequest("incoming_transfers", params);
        
        // interpret incoming_transfers response
        if (resp.transfers === undefined) continue;
        for (let rpcTx of resp.transfers) {
            
          // convert rpc to tx
          let tx = new MoneroTxWallet();
          tx.setIsIncoming(true);
          tx.setIsConfirmed(true);
          tx.setInTxPool(false);
          tx.setIsCoinbase(false);
          MoneroWalletRpc._buildTxWallet(rpcTx, tx);
          let address = await this.getAddress(accountIdx, tx.getPayments()[0].getSubaddressIndex());
          tx.getPayments()[0].setAddress(address);
          
          // mark coinbase transactions if applicable which `incoming_transfers` does not provide
          for (let allTx of txs) {
            if (allTx.getIsCoinbase() && allTx.getId() === tx.getId()) tx.setIsCoinbase(true);
          }
          
          // add tx to existing txs
          MoneroWalletRpc._addTx(txs, tx, false);
        }
      }
    }
    
    // filter final result
    let toRemoves = [];
    for (let tx of txs) if (!filter.meetsCriteria(tx)) toRemoves.push(tx);
    return txs.filter(tx => !toRemoves.includes(tx));
  }
  
  async send(configOrAddress, amount, paymentId, priority, mixin, fee) {
    return await this._send(false, configOrAddress, amount, paymentId, priority, mixin, fee);
  }

  async sendSplit(configOrAddress, amount, paymentId, priority, mixin, fee) { // TODO: good on fee param?
    return await this._send(true, configOrAddress, amount, paymentId, priority, mixin, fee);
  }
  
  async sweep(config) {
    
    // common request params
    let params = {};
    params.address = config.getPayments()[0].getAddress();
    params.priority = config.getPriority();
    params.mixin = config.getMixin();
    params.unlock_time = config.getUnlockTime();
    params.payment_id = config.getPaymentId();
    params.do_not_relay = config.getDoNotRelay();
    params.below_amount = config.getBelowAmount();
    params.get_tx_keys = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // determine accounts to sweep from; default to all with unlocked balance if not specified
    let accountIndices = [];
    if (config.getAccountIndex() !== undefined) {
      accountIndices.push(config.getAccountIndex());
    } else {
      for (let account of getAccounts()) {
        if (account.getUnlockedBalance().compare(BigInteger.valueOf(0)) > 0) {
          accountIndices.push(account.getIndex());
        }
      }
    }
    
    // sweep from each account and collect unique transactions
    let txs = [];
    for (let accountIdx of accountIndices) {
      params.account_index = accountIdx;
      
      // collect transactions for account
      let accountTxs = [];
      
      // determine subaddresses to sweep from; default to all with unlocked balance if not specified
      let subaddressIndices = [];
      if (config.getSubaddressIndices() !== undefined) {
        for (let subaddressIdx of config.getSubaddressIndices()) {
          subaddressIndices.push(subaddressIdx);
        }
      } else {
        for (let subaddress of await this.getSubaddresses(accountIdx)) {
          if (subaddress.getUnlockedBalance().compare(new BigInteger(0)) > 0) {
            subaddressIndices.push(subaddress.getSubaddressIndex());
          }
        }
      }
      if (subaddressIndices.length === 0) throw new Error("No subaddresses to sweep from");
      
      // sweep each subaddress individually
      if (config.getSweepEachSubaddress() === undefined || config.getSweepEachSubaddress()) {
        for (let subaddressIdx of subaddressIndices) {
          params.subaddr_indices = [subaddressIdx];
          let resp = await this.config.rpc.sendJsonRequest("sweep_all", params);
          
          // initialize tx per subaddress
          let respTxs = [];
          for (let i = 0; i < resp.tx_hash_list.length; i++) {
            let tx = new MoneroTxWallet();
            tx.setSrcSubaddressIndex(subaddressIdx);
            respTxs.push(tx);
          }
          
          // initialize fields from response
          MoneroWalletRpc._buildTxsWallet(resp, respTxs);
          for (let tx of respTxs) accountTxs.push(tx);
        }
      }
      
      // sweep all subaddresses together
      else {
        params.subaddr_indices = [subaddressIndices];
        let resp = this.config.rpc.sendJsonRequest("sweep_all", params);
        
        // initialize tx per subaddress
        let respTxs = [];
        for (let i = 0; i < resp.tx_hash_list.length; i++) {
          let tx = new MoneroTxWallet();
          tx.setSrcSubaddressIndex(subaddressIdx);
          respTxs.push(tx);
        }
        
        // initialize fields from response
        MoneroWalletRpc._buildTxsWallet(resp, respTxs);
        for (let tx of respTxs) accountTxs.push(tx);
      }
      
      // initialize common fields and merge transactions from account
      for (let tx of accountTxs) {
        tx.setSrcAccountIndex(accountIdx);
        tx.setIsOutgoing(true);
        tx.setIsIncoming(false);
        tx.setIsConfirmed(false);
        tx.setInPool(true);
        tx.setMixin(config.getMixin());
        MoneroWalletRpc._addTx(txs, tx, true);
      }
      
      // fetch transactions by id and merge complete data
      assert(accountTxs.length > 0);
      let ids = [];
      for (let tx of accountTxs) if (tx.getId() !== undefined) ids.push(tx.getId());
      if (ids.length > 0) assert.equal(accountTxs.length, ids.length);
      if (ids.length > 0) {
        let filter = new MoneroTxFilter();
        filter.setAccountIndex(accountIdx);
        filter.setTxIds(ids);
        filter.setIncoming(false);
        for (let tx of getTxs(filter)) MoneroWalletRpc._addTx(txs, tx, true);
      }
    }
    
    // return transactions from all accounts
    return txs;
  }
  
  async sweepDust(doNotRelay) {
    throw new Error("Not implemented");
  }
  
  async relayTxs(txs) {
    
    // relay transactions and collect resulting ids
    let txIds = [];
    for (let tx of txs)  {
      let resp = await this.config.rpc.sendJsonRequest("relay_tx", { hex: tx.getMetadata() });
      txIds.push(resp.tx_hash);
    }
    
    // fetch transactions by id
    let filter = new MoneroTxFilter();
    filter.setIsIncoming(false);
    filter.setTxIds(txIds);
    let relayedTxs = await this.getTxs(filter);
    
    // transfer tx data
    assert.equal(txs.length, relayedTxs.length);
    for (let i = 0; i < txs.length; i++) {
      assert.equal(txs[i].getId(), relayedTxs[i].getId());
      relayedTxs[i].setDoNotRelay(false);
      relayedTxs[i].setIsRelayed(true);
      relayedTxs[i].setMixin(txs[i].getMixin());
      relayedTxs[i].setKey(txs[i].getKey());
      relayedTxs[i].setPayments(txs[i].getPayments());
      relayedTxs[i].setHex(txs[i].getHex());
      relayedTxs[i].setMetadata(txs[i].getMetadata());
    }
    return relayedTxs;
  }
  
  async getKeyImages() {
    
    // send rpc request
   let resp = await this.config.rpc.sendJsonRequest("export_key_images");
   
   // build key images from response
   let keyImages = [];
   if (resp.signed_key_images) {
     for (let rpcKeyImage of resp.signed_key_images) {
       let keyImage = new MoneroKeyImage();
       keyImages.push(keyImage);
       keyImage.setId(rpcKeyImage.key_image);
       keyImage.setSignature(rpcKeyImage.signature);
     }
   }
   return keyImages;
  }
  
  async importKeyImages() {
    throw new Error("Not implemented"); 
  }
  
  async getTxNote(txId) {
    return (await this.getTxNotes([txId]))[0];
  }

  async setTxNote(txId, note) {
    await this.setTxNotes([txId], [note]);
  }
  
  async getTxNotes(txIds) {
    return (await this.config.rpc.sendJsonRequest("get_tx_notes", {txids: txIds})).notes;
  }
  
  async setTxNotes(txIds, notes) {
    await this.config.rpc.sendJsonRequest("set_tx_notes", {txids: txIds, notes: notes});
  }
  
  async getTxKey(txId) {
    return (await this.config.rpc.sendJsonRequest("get_tx_key", {txid: txId})).tx_key;
  }
  
  async checkTxKey(txId, txKey, address) {
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest("check_tx_key", {txid: txId, tx_key: txKey, address: address});
    
    // interpret result
    let check = new MoneroCheckTx();
    check.setIsGood(true);
    check.setNumConfirmations(resp.confirmations);
    check.setInPool(resp.in_pool);
    check.setAmountReceived(new BigInteger(resp.received));
    return check;
  }
  
  async getTxProof(txId, address, message) {
    let resp = await this.config.rpc.sendJsonRequest("get_tx_proof", {txid: txId, address: address, message: message});
    return resp.signature;
  }
  
  async checkTxProof(txId, address, message, signature) {
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest("check_tx_proof", {
      txid: txId,
      address: address,
      message: message,
      signature: signature
    });
    
    // interpret response
    let isGood = resp.good;
    let check = new MoneroCheckTx();
    check.setIsGood(isGood);
    if (isGood) {
      check.setNumConfirmations(resp.confirmations);
      check.setInPool(resp.in_pool);
      check.setAmountReceived(new BigInteger(resp.received));
    }
    return check;
  }
  
  async getSpendProof(txId, message) {
    let resp = await this.config.rpc.sendJsonRequest("get_spend_proof", {txid: txId, message: message});
    return resp.signature;
  }
  
  async checkSpendProof(txId, message, signature) {
    let resp = await this.config.rpc.sendJsonRequest("check_spend_proof", {
      txid: txId,
      message: message,
      signature: signature
    });
    return resp.good;
  }
  
  async getWalletReserveProof(message) {
    let resp = await this.config.rpc.sendJsonRequest("get_reserve_proof", {
      all: true,
      message: message
    });
    return resp.signature;
  }
  
  // TODO: probably getReserveProofAccount(), getReserveProofWallet()
  async getAccountReserveProof(accountIdx, amount, message) {
    let resp = await this.config.rpc.sendJsonRequest("get_reserve_proof", {
      account_index: accountIdx,
      amount: amount.toString(),
      message: message
    });
    return resp.signature;
  }

  async checkReserveProof(address, message, signature) {
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest("check_reserve_proof", {
      address: address,
      message: message,
      signature: signature
    });
    
    // interpret results
    let isGood = resp.good;
    let check = new MoneroCheckReserve();
    check.setIsGood(isGood);
    if (isGood) {
      check.setAmountSpent(new BigInteger(resp.spent));
      check.setAmountTotal(new BigInteger(resp.total));
    }
    return check;
  }
  
  // -------------------------- SPECIFIC TO RPC WALLET ------------------------
  
  /**
   * TODO
   */
  async createWallet(filename, password, language) {
    if (!filename) throw new Error("Filename is not initialized");
    if (!password) throw new Error("Password is not initialized");
    if (!language) throw new Error("Language is not initialized");
    let params = { filename: filename, password: password, language: language };
    await this.config.rpc.sendJsonRequest("create_wallet", params);
  }
  
  /**
   * TODO
   */
  async openWallet(filename, password) {
    if (!filename) throw new Error("Filename is not initialized");
    if (!password) throw new Error("Password is not initialized");
    await this.config.rpc.sendJsonRequest("open_wallet", {filename: filename, password: password});
    delete this.addressCache;
    this.addressCache = {};
  }
  
  /**
   * TODO
   */
  async rescanSpent() {
    await this.config.rpc.sendJsonRequest("rescan_spent");
  }
  
  /**
   * TODO
   */
  async saveBlockchain() {
    await this.config.rpc.sendJsonRequest("store");
  }
  
  /**
   * TODO
   * 
   * WARNING: discards local wallet data like destination addresses
   */
  async rescanBlockchain() {
    await this.config.rpc.sendJsonRequest("rescan_blockchain");
  }
  
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    await this.config.rpc.sendJsonRequest("start_mining", {
      threads_count: numThreads,
      do_background_mining: backgroundMining,
      ignore_battery: ignoreBattery
    });
  }
  
  async stopMining() {
    await this.config.rpc.sendJsonRequest("stop_mining");
  }
  
  /**
   * Stop the wallet.
   */
  async stopWallet() {
    await this.config.rpc.sendJsonRequest("stop_wallet");
    delete this.addressCache;
    this.addressCache = {};
  }
  
  // --------------------------------  PRIVATE --------------------------------
  
  async _getAllAccountAndSubaddressIndices() {
    let indices = new Map();
    for (let account of await this.getAccounts()) {
      indices.set(account.getIndex(), await this._getSubaddressIndices(account.getIndex()));
    }
    return indices;
  }
  
  async _getSubaddressIndices(accountIdx) {
    let subaddressIndices = [];
    let resp = await this.config.rpc.sendJsonRequest("get_address", {account_index: accountIdx});
    for (let address of resp.addresses) subaddressIndices.push(address.address_index);
    return subaddressIndices;
  }
  
  static _buildTxWallet(rpcTx, tx) {  // TODO: change everything to safe set
        
    // initialize tx to return
    if (!tx) tx = new MoneroTxWallet();
    
    // initialize transaction type and state from rpc type
    if (rpcTx.type !== undefined) MoneroWalletRpc._decodeRpcType(rpcTx.type, tx);
    else {
      assert.equal("boolean", typeof tx.getIsOutgoing());
      assert.equal("boolean", typeof tx.getIsIncoming());
      assert.equal("boolean", typeof tx.getIsConfirmed());
      assert.equal("boolean", typeof tx.getInTxPool());
      assert.equal("boolean", typeof tx.getIsCoinbase());
    }
    
    // TODO: safe set
    // initialize remaining fields  TODO: seems this should be part of common function with DaemonRpc._buildTx
    let payment;
    let accountIdx;
    let subaddressIdx;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "fee") tx.setFee(new BigInteger(val));
      else if (key === "block_height") tx.setHeight(val);
      else if (key === "note") { if (val) tx.setNote(val); }
      else if (key === "timestamp") {
        if (tx.getIsConfirmed()) tx.setBlockTimestamp(val);
        else if (tx.getIsOutgoing()) tx.setLastRelayedTime(val);
        else tx.setReceivedTime(val);
      }
      else if (key === "txid") tx.setId(val);
      else if (key === "tx_hash") tx.setId(val);
      else if (key === "tx_key") tx.setKey(val);
      else if (key === "type") { } // type already handled
      else if (key === "tx_size") tx.setSize(val);
      else if (key === "unlock_time") tx.setUnlockTime(val);
      else if (key === "global_index") { } // ignore
      else if (key === "tx_blob") tx.setHex(val);
      else if (key === "tx_metadata") tx.setMetadata(val);
      else if (key === "double_spend_seen") tx.setIsDoubleSpend(val);
      else if (key === "confirmations") {
        if (!tx.getIsConfirmed()) tx.setNumConfirmations(0);
        else tx.setNumConfirmations(val);
      }
      else if (key === "suggested_confirmations_threshold") {
        if (tx.getInTxPool()) tx.setNumEstimatedBlocksUntilConfirmed(val);
        else tx.setNumEstimatedBlocksUntilConfirmed(undefined)
      }
      else if (key === "height") {
        tx.setHeight(val === 0 ? undefined : val); // TODO: right?  converted from Java: tx.setHeight(height == 0 ? null : height);
      }
      else if (key === "amount") {
        tx.setTotalAmount(new BigInteger(val));
        if (tx.getIsIncoming()) {
          if (payment === undefined) payment = new MoneroPayment();
          payment.setAmount(new BigInteger(val));
        }
      }
      else if (key === "address") {
        if (tx.getIsOutgoing()) tx.setSrcAddress(val);
        else {
          if (payment === undefined) payment = new MoneroPayment();
          payment.setAddress(val);
        }
      }
      else if (key === "key_image") {
        assert(tx.getIsIncoming());
        if (payment === undefined) payment = new MoneroPayment();
        payment.setKeyImage(val);
      }
      else if (key === "spent") {
        assert(tx.getIsIncoming());
        if (payment === undefined) payment = new MoneroPayment();
        payment.setIsSpent(val);
      }
      else if (key === "payment_id") {
        if (MoneroTxWallet.DEFAULT_PAYMENT_ID !== val) tx.setPaymentId(val);  // default is undefined
      }
      else if (key === "subaddr_index") {
        if (typeof val === "number") {
          subaddressIdx = val;
        } else {
          accountIdx = val.major;
          subaddressIdx = val.minor;
        }
      }
      else if (key === "destinations") {
        assert(tx.getIsOutgoing());
        let payments = [];
        for (let rpcPayment of val) {
          let aPayment = new MoneroPayment();
          payments.push(aPayment);
          for (let paymentKey of Object.keys(rpcPayment)) {
            if (paymentKey === "address") aPayment.setAddress(rpcPayment[paymentKey]);
            else if (paymentKey === "amount") aPayment.setAmount(new BigInteger(rpcPayment[paymentKey]));
            else throw new Error("Unrecognized transaction destination field: " + paymentKey);
          }
        }
        tx.setPayments(payments);
      }
      else if (key === "multisig_txset" && !val) {} // TODO: handle this with value
      else if (key === "unsigned_txset" && !val) {} // TODO: handle this with value
      else console.log("WARNING: ignoring unexpected transaction field: '" + key + "': " + val);
    }
    
    // initialize final fields
    if (tx.getPayments() !== undefined) assert(payment === undefined);
    else if (payment !== undefined) tx.setPayments([payment]);
    if (tx.getIsOutgoing()) {
      MoneroUtils.safeSet(tx, tx.getSrcAccountIndex, tx.setSrcAccountIndex, accountIdx);
      MoneroUtils.safeSet(tx, tx.getSrcSubaddressIndex, tx.setSrcSubaddressIndex, subaddressIdx);
    } else {
      assert(payment);
      assert.equal(1, tx.getPayments().length);
      payment.setAccountIndex(accountIdx);
      payment.setSubaddressIndex(subaddressIdx);
    }
    if (tx.getPayments() !== undefined && tx.getIsIncoming() && tx.getInTxPool()) {
      for (let aPayment of tx.getPayments()) aPayment.setIsSpent(false);  // incoming txpool payments are not spent
    }
    
    // return initialized transaction
    return tx;
  }
  
  /**
   * Initializes a MoneroTxWallet[] from a list of rpc txs.
   * 
   * @param rpcTxs are the rpc txs to initialize the MoneroTxWallets from
   * @param txs are existing txs to initialize (optional)
   */
  static _buildTxsWallet(rpcTxs, txs) {
    
    // get lists
    let ids = rpcTxs.tx_hash_list;
    let keys = rpcTxs.tx_key_list;
    let blobs = rpcTxs.tx_blob_list;
    let metadatas = rpcTxs.tx_metadata_list;
    let fees = rpcTxs.fee_list;
    let amounts = rpcTxs.amount_list;
    
    // ensure all lists are the same size
    let sizes = new Set();
    sizes.add(ids.length).add(blobs.length).add(metadatas.length).add(fees.length).add(amounts.length);
    if (keys) sizes.add(keys.length);
    assert.equal(1, sizes.size, "RPC lists are different sizes");
    
    // initialize txs if necessary
    if (!txs) {
      txs = [];
      for (let i = 0; i < ids.length; i++) txs.push(new MoneroTxWallet());
    }
    
    // build transactions
    for (let i = 0; i < ids.length; i++) {
      let tx = txs[i];
      tx.setId(ids[i]);
      if (keys) tx.setKey(keys[i]);
      tx.setHex(blobs[i]);
      tx.setMetadata(metadatas[i]);
      tx.setFee(new BigInteger(fees[i]));
      tx.setTotalAmount(new BigInteger(amounts[i]));
    }
    return txs;
  }
  
//  /**
//   * Initializes the source information of the given transaction.
//   * 
//   * @param tx is the transaction to initialize the source information of
//   * @param accountIdx specifies the tx's source account index
//   * @param subaddressIdx specifies the tx's source subaddress index
//   * @param wallet is used to determine the address of the given account and subaddress
//   */
//  static async _initializeTxWalletSrc(tx, accountIdx, subaddressIdx, wallet) {
//    assert(accountIdx >= 0);
//    assert(subaddressIdx >= 0);
//    tx.setAccountIndex(accountIdx);
//    tx.setSubaddressIndex(subaddressIdx);
//    tx.setAddress(await wallet.getAddress(accountIdx, subaddressIdx));
//  }
  
  /**
   * Decodes a "type" from monero-wallet-rpc to initialize type and state
   * fields in the given transaction.
   * 
   * @param rpcType is the type to decode
   * @param tx is the transaction decode known fields to
   */
  static _decodeRpcType(rpcType, tx) {
    if (rpcType === "in") {
      tx.setIsIncoming(true);
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsCoinbase(false);
    } else if (rpcType === "out") {
      tx.setIsIncoming(false);
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setIsFailed(false);
    } else if (rpcType === "pool") {
      tx.setIsIncoming(true);
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsCoinbase(false);  // TODO: but could it be?
    } else if (rpcType === "pending") {
      tx.setIsIncoming(false);
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setIsFailed(false);
    } else if (rpcType === "block") {
      tx.setIsIncoming(true);
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsCoinbase(true);
    } else if (rpcType === "failed") {
      tx.setIsIncoming(false);
      tx.setIsConfirmed(false);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setIsFailed(true);
    }
  }
  
  /**
   * Merges a transaction into a unique set of transactions.
   * 
   * @param txs are existing transactions to merge into
   * @param tx is the transaction to merge into the existing txs
   * @param mergePayments specifies if payments should be merged with xor appended to existing payments
   */
  static _addTx(txs, tx, mergePayments) {
    assert(tx.getId() !== undefined);
    assert(tx.getIsIncoming() !== undefined);
    let mergedTx;
    for (let aTx of txs) {
      if (aTx.getId() === tx.getId() && aTx.getIsIncoming() === tx.getIsIncoming()) {
        aTx.merge(tx, mergePayments);
        mergedTx = aTx;
      }
    }
    if (mergedTx === undefined) txs.push(tx);  // add tx if it wasn't merged
  }
  
  /**
   * Common method to create a send transaction.
   */
  async _send(split, configOrAddress, amount, paymentId, priority, mixin, fee) {
    
    // normalize send config
    let config;
    if (configOrAddress instanceof MoneroSendConfig) config = configOrAddress;
    else config = new MoneroSendConfig(configOrAddress, amount, paymentId, priority, mixin, fee);
    assert.equal(undefined, config.getSweepEachSubaddress());
    assert.equal(undefined, config.getBelowAmount());
    
    // determine account and subaddresses to send from
    let accountIdx = config.getAccountIndex();
    if (accountIdx === undefined) throw new Error("Must specify account index to send from");
    let subaddressIndices = config.getSubaddressIndices();
    if (subaddressIndices === undefined) subaddressIndices = await this._getSubaddressIndices(accountIdx);   
    
    // build request parameters
    let params = {};
    params.destinations = [];
    for (let payment of config.getPayments()) {
      assert(payment.getAddress(), "Payment address is not defined");
      assert(payment.getAmount(), "Payment amount is not defined");
      params.destinations.push({ address: payment.getAddress(), amount: payment.getAmount().toString() });
    }
    params.account_index = accountIdx;
    params.subaddr_indices = subaddressIndices;
    params.payment_id = config.getPaymentId();
    params.mixin = config.getMixin();
    params.unlock_time = config.getUnlockTime();
    params.do_not_relay = config.getDoNotRelay();
    params.get_tx_key = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // send request
    let rpcResp;
    if (split) rpcResp = await this.config.rpc.sendJsonRequest("transfer_split", params);
    else rpcResp = await this.config.rpc.sendJsonRequest("transfer", params);
    
    // initialize tx list
    let txs = [];
    if (split) for (let i = 0; i < rpcResp.tx_hash_list.length; i++) txs.push(new MoneroTxWallet());
    else txs.push(new MoneroTxWallet());
    
    // initialize known fields of tx
    for (let tx of txs) {
      tx.setIsOutgoing(true);
      tx.setIsConfirmed(false);
      tx.setInTxPool(config.getDoNotRelay() ? false : true);
      tx.setIsCoinbase(false);
      tx.setDoNotRelay(config.getDoNotRelay() ? true : false)
      tx.setIsRelayed(!tx.getDoNotRelay());
      tx.setMixin(config.getMixin());
      tx.setPayments(config.getPayments());
      tx.setPaymentId(config.getPaymentId());
      tx.setSrcAddress(await this.getAddress(accountIdx, 0));
      tx.setSrcAccountIndex(accountIdx);
      tx.setSrcSubaddressIndex(0); // TODO (monero-wallet-rpc): outgoing subaddress idx is always 0
      if (!tx.getDoNotRelay()) {
        if (tx.getLastRelayedTime() === undefined) tx.setLastRelayedTime(+new Date().getTime());  // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
        if (tx.getUnlockTime() === undefined) tx.setUnlockTime(config.getUnlockTime() === undefined ? 0 : config.getUnlockTime());
        if (tx.getIsDoubleSpend() === undefined) tx.setIsDoubleSpend(false);
      }
    }
    
    // initialize tx from rpc response
    if (split) MoneroWalletRpc._buildTxsWallet(rpcResp, txs);
    else MoneroWalletRpc._buildTxWallet(rpcResp, txs[0]);
    
    // return array or element depending on split
    return split ? txs : txs[0];
  }
}

module.exports = MoneroWalletRpc;