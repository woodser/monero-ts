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
const MoneroWalletTx = require("./model/MoneroWalletTx");
const MoneroPayment = require("./model/MoneroPayment");
const MoneroWalletOutput = require("./model/MoneroWalletOutput");
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
      subaddress.setUnspentOutputCount(0);
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
          subaddress.setUnspentOutputCount(respSubaddress.num_unspent_outputs);
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
    subaddress.setUnspentOutputCount(0);
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
  
  // TODO: use cache
  async getAddressIndex(address) {
    let resp = this.config.rpc.sendJsonRequest("get_address_index", {address: address});
    let subaddress = new MoneroSubaddress(address);
    subaddress.setAccountIndex(resp.index.major);
    subaddress.setSubaddressIndex(resp.index.minor);
    return subaddress;
  }
  
  async getTxs(filterOrAccountIdx, subaddressIdx, debugTxId) {
    
    // txs to return
    let txs = [];
    
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
    
    // determine account and subaddress indices to be queried
    let indices = new Map();
    if (filter.getAccountIndex() !== undefined) {
      indices.set(filter.getAccountIndex(), filter.getSubaddressIndices() ? GenUtils.copyArray(filter.getSubaddressIndices()) : await this._getSubaddressIndices(filter.getAccountIndex()));
    } else {
      if (filter.getSubaddressIndices() !== undefined) throw new Error("Filter specifies subaddress indices but not an account index");
      indices = await this._getAllAccountAndSubaddressIndices();
    }
    
    // build params for `get_transfers` rpc call
    // must get everything in order to know what is excluded by filter
    let params = {};
    params.in = true;
    params.out = true;
    params.pool = true;
    params.pending = true;
    params.failed = filter.getIsOutgoing() !== false && filter.getIsFailed() !== false;
    params.filter_by_height = filter.getMinHeight() !== undefined || filter.getMaxHeight() !== undefined;
    if (filter.getMinHeight() !== undefined) params.min_height = filter.getMinHeight();
    if (filter.getMaxHeight() !== undefined) params.max_height = filter.getMaxHeight();
    
    // build txs using `get_transfers` for each target account
    for (let accountIdx of indices.keys()) {
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.config.rpc.sendJsonRequest("get_transfers", params);
      for (let key of Object.keys(resp)) {
        for (let rpcTx of resp[key]) {
          if (rpcTx.txid === debugTxId) console.log(rpcTx);
          let tx = MoneroWalletRpc._buildWalletTx(rpcTx);
          MoneroWalletRpc._mergeTx(txs, tx);
          
          // special case: tx sent from/to same account can have amount 0
          // TODO monero-wallet-rpc: missing incoming payments for txs sent from/to same account #4500
          // TODO monero-wallet-rpc: confirmed tx from/to same account has amount 0 but cached payments
          if (tx.getIsOutgoing() && tx.getIsRelayed() && !tx.getIsFailed() && tx.getOutgoingAmount().compare(new BigInteger(0)) === 0) {
            
            // use information from cached destinations if available
            if (tx.getOutgoingPayments()) {
              
              // replace tx amount with payment sum if different
              let paymentTotal = new BigInteger();
              for (let payment of tx.getOutgoingPayments()) paymentTotal = paymentTotal.add(payment.getAmount());
              if (tx.getOutgoingAmount().compare(paymentTotal) !== 0) tx.setOutgoingAmount(paymentTotal);
              
              // reconstruct incoming payments from outgoing payments
              let incomingPayments = [];
              for (let outgoingPayment of tx.getOutgoingPayments()) {
                let incomingPayment = new MoneroPayment();
                incomingPayments.push(incomingPayment);
                incomingPayment.setAmount(outgoingPayment.getAmount());
                incomingPayment.setAddress(outgoingPayment.getAddress());
                incomingPayment.setAccountIndex(tx.getSrcAccountIndex());
                
                // set subaddress index which may be the same as src or may need to be looked up
                if (outgoingPayment.getAddress() === tx.getSrcAddress()) incomingPayment.setSubaddressIndex(tx.getSrcSubaddressIndex());
                else incomingPayment.setSubaddressIndex((await this.getAddressIndex(incomingPayment.getAddress())).getSubaddressIndex());
              }
              tx.setIncomingPayments(incomingPayments);
            }
            
            // set incoming tx amount
            tx.setIncomingAmount(new BigInteger(tx.getOutgoingAmount()));
            
//            // TODO: test and enable this?
//            // fabricate outgoing payment 0 if it doesn't exist
//            if (tx.getOutgoingPayments()) {
//              assert.equal(1, tx.getOutgoingPayments().length);
//              assert.equal(0, new BigInteger(0).compare(tx.getOutgoingPayments()[0]));
//              let payment = new MoneroPayment();
//              payment.setAddress(tx.getSrcAddress());
//              payment.setAmount(new BigInteger(0));
//              tx.setOutgoingPayments([payment]);
//            }
//            
//            // fabricate incoming payment 0
//            // TODO monero-wallet-rpc: return known 'in' payment counterpart so client doesn't need to fabricate #4500
//            assert(tx.getIncomingPayments() === undefined);
//            let incomingPayment = new MoneroPayment();
//            incomingPayment.setAccountIndex(tx.getSrcAccountIndex());
//            incomingPayment.setSubaddressIndex(tx.getSrcSubaddressIndex());
//            incomingPayment.setAddress(tx.getSrcAddress());
//            incomingPayment.setAmount(new BigInteger(tx.getOutgoingAmount()));
//            tx.setIncomingAmount(new BigInteger(tx.getOutgoingAmount))
//            tx.setIncomingPayments([incomingPayment]);
          }
        }
      }
    }
    
    // if requested, build and merge txs with vouts using `incoming_transfers`
    if (filter.getFetchVouts() === true) { // TODO: add to tx filter, document default behavior, must be set true to get vouts
      params = {};
      params.transfer_type = "all"; // TODO: suppport all | available | unavailable
      for (let accountIdx of indices.keys()) {
        
        // send request
        params.account_index = accountIdx;
        params.subaddr_indices = filter.getSubaddressIndices(); // undefined subaddr_indices will fetch all incoming_transfers
        let resp = await this.config.rpc.sendJsonRequest("incoming_transfers", params);
        
        // convert response to txs with vouts and merge
        if (resp.transfers === undefined) continue;
        for (let rpcVout of resp.transfers) {
          if (rpcVout.tx_hash === debugTxId) console.log(rpcVout);
          let tx = MoneroWalletRpc._buildWalletTxVout(rpcVout);
          MoneroWalletRpc._mergeTx(txs, tx, true);  // TODO: skip merging tx if absent because of monero-wallet-rpc #4500
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
            let tx = new MoneroWalletTx();
            tx.setSrcSubaddressIndex(subaddressIdx);
            respTxs.push(tx);
          }
          
          // initialize fields from response
          MoneroWalletRpc._buildWalletTxs(resp, respTxs);
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
          let tx = new MoneroWalletTx();
          tx.setSrcSubaddressIndex(subaddressIdx);
          respTxs.push(tx);
        }
        
        // initialize fields from response
        MoneroWalletRpc._buildWalletTxs(resp, respTxs);
        for (let tx of respTxs) accountTxs.push(tx);
      }
      
      // initialize common fields and merge transactions from account
      for (let tx of accountTxs) {
        tx.setSrcAccountIndex(accountIdx);
        tx.setIsOutgoing(true);
        tx.setIsIncoming(false);
        tx.setIsConfirmed(false);
        tx.setInTxPool(true);
        tx.setMixin(config.getMixin());
        MoneroWalletRpc._mergeTx(txs, tx);
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
        for (let tx of getTxs(filter)) MoneroWalletRpc._mergeTx(txs, tx);
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
    check.setConfirmationCount(resp.confirmations);
    check.setInTxPool(resp.in_pool);
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
      check.setConfirmationCount(resp.confirmations);
      check.setInTxPool(resp.in_pool);
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
  
  /**
   * Builds a MoneroWalletTx from a RPC tx.
   * 
   * @param rpcTx is the rpc tx to build from
   * @param tx is an existing tx to continue initializing (optional)
   * @param isOutgoing specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
   * @returns {MoneroWalletTx} is the initialized tx
   */
  static _buildWalletTx(rpcTx, tx, isOutgoing) {  // TODO: change everything to safe set
        
    // initialize tx to return
    if (!tx) tx = new MoneroWalletTx();
    
    // initialize tx state from rpc type
    if (rpcTx.type !== undefined) isOutgoing = MoneroWalletRpc._decodeRpcType(rpcTx.type, tx);
    else {
      assert.equal("boolean", typeof isOutgoing, "Must indicate if tx is outgoing (true) xor incoming (false) since unknown");
      assert.equal("boolean", typeof tx.getIsConfirmed());
      assert.equal("boolean", typeof tx.getInTxPool());
      assert.equal("boolean", typeof tx.getIsCoinbase());
      assert.equal("boolean", typeof tx.getIsFailed());
      assert.equal("boolean", typeof tx.getDoNotRelay());
    }
    
    // TODO: safe set
    // initialize remaining fields  TODO: seems this should be part of common function with DaemonRpc._buildTx
    let accountIdx;
    let subaddressIdx;
    let incomingPayment;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "fee") tx.setFee(new BigInteger(val));
      else if (key === "block_height") tx.setHeight(val);
      else if (key === "height") tx.setHeight(val === 0 ? undefined : val); // TODO: collapse into above, what about genesis block / txs?
      else if (key === "note") { if (val) tx.setNote(val); }
      else if (key === "txid") tx.setId(val);
      else if (key === "tx_hash") tx.setId(val);
      else if (key === "tx_key") tx.setKey(val);
      else if (key === "type") { } // type already handled
      else if (key === "tx_size") tx.setSize(val);
      else if (key === "unlock_time") tx.setUnlockTime(val);
      else if (key === "tx_blob") tx.setHex(val);
      else if (key === "tx_metadata") tx.setMetadata(val);
      else if (key === "double_spend_seen") tx.setIsDoubleSpend(val);
      else if (key === "timestamp") {
        if (tx.getIsConfirmed()) tx.setBlockTimestamp(val);
        else tx.setReceivedTime(val);
      }
      else if (key === "confirmations") {
        if (!tx.getIsConfirmed()) tx.setConfirmationCount(0);
        else tx.setConfirmationCount(val);
      }
      else if (key === "suggested_confirmations_threshold") {
        if (tx.getInTxPool()) tx.setEstimatedBlockCountUntilConfirmed(val);
        else tx.setEstimatedBlockCountUntilConfirmed(undefined)
      }
      else if (key === "amount") {
        if (isOutgoing) tx.setOutgoingAmount(new BigInteger(val));
        else {
          tx.setIncomingAmount(new BigInteger(val));
          if (incomingPayment === undefined) incomingPayment = new MoneroPayment();
          incomingPayment.setAmount(new BigInteger(val));
        }
      }
      else if (key === "address") {
        if (isOutgoing) tx.setSrcAddress(val);
        else {
          if (incomingPayment === undefined) incomingPayment = new MoneroPayment();
          incomingPayment.setAddress(val);
        }
      }
      else if (key === "payment_id") {
        if (MoneroWalletTx.DEFAULT_PAYMENT_ID !== val) tx.setPaymentId(val);  // default is undefined
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
        assert(isOutgoing);
        let payments = [];
        for (let rpcPayment of val) {
          let payment = new MoneroPayment();
          payments.push(payment);
          for (let paymentKey of Object.keys(rpcPayment)) {
            if (paymentKey === "address") payment.setAddress(rpcPayment[paymentKey]);
            else if (paymentKey === "amount") payment.setAmount(new BigInteger(rpcPayment[paymentKey]));
            else throw new Error("Unrecognized transaction destination field: " + paymentKey);
          }
        }
        tx.setOutgoingPayments(payments);
      }
      else if (key === "multisig_txset" && !val) {} // TODO: handle this with value
      else if (key === "unsigned_txset" && !val) {} // TODO: handle this with value
      else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }
    
    // initialize final fields
    if (isOutgoing) {
      MoneroUtils.safeSet(tx, tx.getSrcAccountIndex, tx.setSrcAccountIndex, accountIdx);
      MoneroUtils.safeSet(tx, tx.getSrcSubaddressIndex, tx.setSrcSubaddressIndex, subaddressIdx); // TODO: standardize safeset, reconcile, straight set
      assert.equal(undefined, incomingPayment);
    } else {
      assert(incomingPayment);
      incomingPayment.setAccountIndex(accountIdx);
      incomingPayment.setSubaddressIndex(subaddressIdx);
      tx.setIncomingPayments([incomingPayment]);
    }
    
    // return initialized transaction
    return tx;
  }
  
  static _buildWalletTxVout(rpcVout) {
    
    // initialize tx
    let tx = new MoneroWalletTx();
    tx.setIsConfirmed(true);
    tx.setIsRelayed(true);
    tx.setIsFailed(false);
    
    // initialize vout
    let vout = new MoneroWalletOutput();
    for (let key of Object.keys(rpcVout)) {
      let val = rpcVout[key];
      if (key === "amount") vout.setAmount(new BigInteger(val));
      else if (key === "spent") vout.setIsSpent(val);
      else if (key === "key_image") vout.setKeyImage(val);
      else if (key === "global_index") vout.setIndex(val);
      else if (key === "tx_hash") tx.setId(val);
      else if (key === "subaddr_index") {
        vout.setAccountIndex(val.major);
        vout.setSubaddressIndex(val.minor);
      }
      else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }
    
    // initialize tx with vout
    tx.setVouts([vout]);
    return tx;
  }
  
  /**
   * Initializes a MoneroWalletTx[] from a list of rpc txs.
   * 
   * @param rpcTxs are the rpc txs to initialize the MoneroTxWallets from
   * @param txs are existing txs to initialize (optional)
   */
  static _buildWalletTxs(rpcTxs, txs) {
    
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
      for (let i = 0; i < ids.length; i++) txs.push(new MoneroWalletTx());
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
   * TODO: these should be safe set
   * 
   * @param rpcType is the type to decode
   * @param tx is the transaction decode known fields to
   * @return {boolean} true if the rpc type is outgoing xor false if incoming
   */
  static _decodeRpcType(rpcType, tx) {
    let isOutgoing;
    if (rpcType === "in") {
      isOutgoing = false;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(false);
      tx.setIsCoinbase(false);
    } else if (rpcType === "out") {
    	isOutgoing = true;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(false);
      tx.setIsCoinbase(false);
    } else if (rpcType === "pool") {
    	isOutgoing = false;
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(false);
      tx.setIsCoinbase(false);  // TODO: but could it be?
    } else if (rpcType === "pending") {
    	isOutgoing = true;
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(false);
      tx.setIsCoinbase(false);
    } else if (rpcType === "block") {
    	isOutgoing = false;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(false);
      tx.setIsCoinbase(true);
    } else if (rpcType === "failed") {
    	isOutgoing = true;
      tx.setIsConfirmed(false);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(true);
      tx.setIsCoinbase(false);
    } else {
      throw new Error("Unrecognized transfer type: " + rpcType);
    }
    return isOutgoing;
  }
  
  /**
   * Merges a transaction into a unique set of transactions.
   * 
   * TODO monero-wallet-rpc: skipIfAbsent only necessary because incoming payments not returned
   * when sent from/to same account
   * 
   * @param txs are existing transactions to merge into
   * @param tx is the transaction to merge into the existing txs
   * @param skipIfAbsent specifies if the tx should not be added
   *        if it doesn't already exist.  Only necessasry to handle
   *        missing incoming payments from #4500. // TODO
   */
  static _mergeTx(txs, tx, skipIfAbsent) {
    assert(tx.getId());
    for (let aTx of txs) {
      if (aTx.getId() === tx.getId()) {
        aTx.merge(tx);
        return;
      }
    }
    
    // add tx if it doesn't already exist unless skipped
    if (!skipIfAbsent) txs.push(tx);
    else console.log("WARNING: tx does not already exist"); 
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
    if (config.getCanSplit() !== undefined) assert.equal(split, config.getCanSplit());
    
    // determine account and subaddresses to send from
    let accountIdx = config.getAccountIndex();
    if (accountIdx === undefined) throw new Error("Must specify account index to send from");
    let subaddressIndices = config.getSubaddressIndices();
    if (subaddressIndices === undefined) subaddressIndices = await this._getSubaddressIndices(accountIdx);   
    
    // build request parameters
    let params = {};
    params.destinations = [];
    for (let payment of config.getPayments()) {
      assert(payment.getAddress(), "Destination address is not defined");
      assert(payment.getAmount(), "Destination amount is not defined");
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
    if (split) for (let i = 0; i < rpcResp.tx_hash_list.length; i++) txs.push(new MoneroWalletTx());
    else txs.push(new MoneroWalletTx());
    
    // initialize known fields of tx
    for (let tx of txs) {
      tx.setIsConfirmed(false);
      tx.setConfirmationCount(0);
      tx.setInTxPool(config.getDoNotRelay() ? false : true);
      tx.setDoNotRelay(config.getDoNotRelay() ? true : false)
      tx.setIsRelayed(!tx.getDoNotRelay());
      tx.setIsCoinbase(false);
      tx.setIsFailed(false);
      tx.setMixin(config.getMixin());
      tx.setOutgoingPayments(config.getPayments());
      tx.setPaymentId(config.getPaymentId());
      tx.setSrcAddress(await this.getAddress(accountIdx, 0));
      tx.setSrcAccountIndex(accountIdx);
      tx.setSrcSubaddressIndex(0); // TODO (monero-wallet-rpc): outgoing subaddress idx is always 0
      if (tx.getUnlockTime() === undefined) tx.setUnlockTime(config.getUnlockTime() === undefined ? 0 : config.getUnlockTime());
      if (!tx.getDoNotRelay()) {
        if (tx.getLastRelayedTime() === undefined) tx.setLastRelayedTime(+new Date().getTime());  // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
        if (tx.getIsDoubleSpend() === undefined) tx.setIsDoubleSpend(false);
      }
    }
    
    // initialize txs from rpc response
    if (split) MoneroWalletRpc._buildWalletTxs(rpcResp, txs);
    else MoneroWalletRpc._buildWalletTx(rpcResp, txs[0], true);
    
    // return array or element depending on split
    return split ? txs : txs[0];
  }
}

module.exports = MoneroWalletRpc;