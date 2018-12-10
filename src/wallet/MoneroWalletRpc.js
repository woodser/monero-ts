const assert = require("assert");
const GenUtils = require("../utils/GenUtils");
const MoneroRpc = require("../rpc/MoneroRpc");
const MoneroWallet = require("./MoneroWallet");
const MoneroIntegratedAddress = require("./model/MoneroIntegratedAddress");
const MoneroAccount = require("./model/MoneroAccount");
const MoneroSubaddress = require("./model/MoneroSubaddress");
const MoneroTxFilter = require("./model/MoneroTxFilter");
const MoneroTxWallet = require("./model/MoneroTxWallet");
const MoneroPayment = require("./model/MoneroPayment");
const BigInteger = require("../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

/**
 * Implements a Monero wallet using monero-wallet-rpc.
 * 
 * TODO: remember to clear the address cache on stop wallet
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
    return (await this.config.rpc.sendJsonRpcRequest("get_height")).height;
  }
  
  async getMnemonic() {
    let resp = await this.config.rpc.sendJsonRpcRequest("query_key", { key_type: "mnemonic" });
    return resp.key;
  }
  
  async getPrivateViewKey() {
    let resp = await this.config.rpc.sendJsonRpcRequest("query_key", { key_type: "view_key" });
    return resp.key;
  }
  
  async getLanguages() {
    return (await this.config.rpc.sendJsonRpcRequest("get_languages")).languages;
  }
  
  async getPrimaryAddress() {
    return (await this.config.rpc.sendJsonRpcRequest("get_address", { account_index: 0, address_index: 0 })).address;
  }
  
  async getIntegratedAddress(paymentId) {
    let integratedAddressStr = (await this.config.rpc.sendJsonRpcRequest("make_integrated_address", {payment_id: paymentId})).integrated_address;
    return await this.decodeIntegratedAddress(integratedAddressStr);
  }
  
  async decodeIntegratedAddress(integratedAddress) {
    let resp = await this.config.rpc.sendJsonRpcRequest("split_integrated_address", {integrated_address: integratedAddress});
    return new MoneroIntegratedAddress(resp.standard_address, resp.payment_id, integratedAddress);
  }
  
  // TODO: test and support start_height parameter
  async sync(startHeight, endHeight, onProgress) {
    assert(endHeight === undefined, "Monero Wallet RPC does not support syncing to an end height");
    assert(onProgress === undefined, "Monero Wallet RPC does not support reporting sync progress");
    return await this.config.rpc.sendJsonRpcRequest("refresh");
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
    let resp = await this.config.rpc.sendJsonRpcRequest("get_accounts", {tag: tag});
    
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
    let resp = await this.config.rpc.sendJsonRpcRequest("create_account", {label: label});
    return new MoneroAccount(resp.account_index, resp.address, label, new BigInteger(0), new BigInteger(0));
  }

  async getSubaddresses(accountIdx, subaddressIndices) {
    
    // fetch subaddresses
    let params = {};
    params.account_index = accountIdx;
    if (subaddressIndices) params.address_index = GenUtils.listify(subaddressIndices);
    let resp = await this.config.rpc.sendJsonRpcRequest("get_address", params);
    
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
    resp = await this.config.rpc.sendJsonRpcRequest("get_balance", params);
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
    let resp = await this.config.rpc.sendJsonRpcRequest("create_address", {account_index: accountIdx, label: label});
    
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
      indices.set(filter.getAccountIndex(), filter.getSubaddressIndices() ? GenUtils.copyArray(filter.getSubaddressIndices()) : await this.getSubaddressIndices(filter.getAccountIndex()));
    } else {
      if (filter.getSubaddressIndices() !== undefined) throw new Error("Filter specifies subaddress indices but not an account index");
      indices = await this._getAllAccountAndSubaddressIndices();
    }
    
    // build common params for get_transfers
    let params = {};
    params.in = filter.getIncoming() && filter.getConfirmed();
    params.out = filter.getOutgoing() && filter.getConfirmed();
    params.pool = filter.getIncoming() && filter.getMempool();
    params.pending = filter.getOutgoing() && filter.getMempool();
    params.failed = filter.getOutgoing() && filter.getFailed();
    params.filter_by_height = filter.getMinHeight() !== undefined || filter.getMaxHeight() !== undefined;
    if (filter.getMinHeight() !== undefined) params.min_height = filter.getMinHeight();
    if (filter.getMaxHeight() !== undefined) params.max_height = filter.getMaxHeight();
    
    // get transactions using get_transfers
    for (let accountIdx of indices.keys()) {
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.config.rpc.sendJsonRpcRequest("get_transfers", params);
      for (let key of Object.keys(resp)) {
        for (let rpcTx of resp[key]) {
          let tx = MoneroWalletRpc._buildTxWallet(rpcTx);
          if (tx.getIsIncoming() && tx.getIsConfirmed()) {
            tx.setTotalAmount(new BigInteger(0));
            tx.setPayments(undefined);
          }
          MoneroWalletRpc._addTx(txs, tx, false);
        }
      }
    }

    // get incoming transactions
    if (filter.getIncoming()) {

      // get transactions using `incoming_transfers`
      params = {};
      params.transfer_type = "all"; // TODO: suppport all | available | unavailable 'types' which is different from MoneroTxType
      for (let accountIdx of Object.keys(indices)) {
        params.account_index = accountIdx;
        params.subaddr_indices = filter.getSubaddressIndices(); // null subaddr_indices will fetch all incoming_transfers
        let resp = await this.config.rpc.sendJsonRpcRequest("incoming_transfers", params);
        
        // interpret incoming_transfers response
        if (resp.transfers === undefined) continue;
        for (let rpcTxs of resp.transfers) {
          for (let rpcTx of rpcTxs) {
            
            // convert rpc to tx and assign address
            let tx = MoneroWalletRpc._buildTxWallet(rpcTx, true);
            let address = this.getAddress(accountIdx, tx.getPayments()[0].getSubaddressIndex());
            tx.getPayments()[0].setAddress(address);
            
            // mark coinbase transactions if applicable which `incoming_transfers` does not provide
            for (let allTx of txs) {
              if (allTx.getIsCoinbase() && allTx.getId() === tx.getId()) tx.setIsCoinbase(true);
            }
            
            // add tx to existing txs
            this._addTx(txs, tx, false);
          }
        }
      }
    }
    
    
    // filter final result
    let toRemoves = [];
    for (let tx of txs) {
      if (filter.getPaymentIds() !== undefined && !filter.getPaymentIds().contains(tx.getPaymentId())) toRemoves.push(tx);
      else if (filter.getTxIds() !== undefined && !filter.getTxIds().contains(tx.getId())) toRemoves.push(tx);
      else if (filter.getMinHeight() !== undefined && (tx.getHeight() === undefined || tx.getHeight() < filter.getMinHeight())) toRemoves.push(tx);
      else if (filter.getMaxHeight() !== undefined && (tx.getHeight() === undefined || tx.getHeight() > filter.getMaxHeight())) toRemoves.push(tx);
      else if (filter.getHasPayments() && (tx.getPayments() === undefined || tx.getPayments().length === 0)) toRemoves.push(tx);
      else if (!filter.getHasPayments() && tx.getPayments() !== undefined && !tx.getPayments().length === 0) toRemoves.push(tx);
    }
    let lengthBefore;
    if (toRemoves.length > 0) lengthBefore = txs.length; 
    txs.filter(tx => !toRemoves.includes(tx));  // remove elements
    if (lengthBefore !== undefined) assert(txs.length < lengthBefore);  // TODO: remove this check
    return txs;
  }
  
  // -------------------------- SPECIFIC TO RPC WALLET ------------------------
  
  async createWallet(filename, password, language) {
    if (!filename) throw new Error("Filename is not initialized");
    if (!password) throw new Error("Password is not initialized");
    if (!language) throw new Error("Language is not initialized");
    let params = { filename: filename, password: password, language: language };
    await this.config.rpc.sendJsonRpcRequest("create_wallet", params);
  }
  
  async openWallet(filename, password) {
    if (!filename) throw new Error("Filename is not initialized");
    if (!password) throw new Error("Password is not initialized");
    let params = { filename: filename, password: password };
    await this.config.rpc.sendJsonRpcRequest("open_wallet", params);
    delete this.addressCache;
    this.addressCache = {};
  }
  
  async rescanSpent() {
    await this.config.rpc.sendJsonRpcRequest("rescan_spent");
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
    let resp = await this.config.rpc.sendJsonRpcRequest("get_address", {account_index: accountIdx});
    for (let address of resp.addresses) subaddressIndices.push(address.address_index);
    return subaddressIndices;
  }
  
  static _buildTxWallet(rpcTx, isIncomingConfirmed) {
    
    // initialize tx to return
    let tx = new MoneroTxWallet();
    
    // initialize transaction type and state from rpc type
    if (rpcTx.type !== undefined) {
      MoneroWalletRpc._decodeRpcType(rpcTx.type, tx);
      if (isIncomingConfirmed) {
        assert(tx.getIsIncoming());
        assert(tx.getIsConfirmed());
      }
    } else {
      assert(isIncomingConfirmed, "Tx state is unknown");
      tx.setIsIncoming(true);
      tx.setIsConfirmed(true);
    }
    
    // initialize remaining fields
    let payment;
    let accountIdx;
    let subaddressIdx;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "fee") tx.setFee(new BigInteger(val));
      else if (key === "block_height") tx.setHeight(val);
      else if (key === "note") { if (val) tx.setNote(val); }
      else if (key === "timestamp") tx.setTimestamp(val);
      else if (key === "txid") tx.setId(val);
      else if (key === "tx_hash") tx.setId(val);
      else if (key === "tx_key") tx.setKey(val);
      else if (key === "type") { } // type already handled
      else if (key === "tx_size") tx.setSize(val);
      else if (key === "unlock_time") tx.setUnlockTime(val);
      else if (key === "global_index") { } // ignore
      else if (key === "tx_blob") tx.setBlob(val);
      else if (key === "tx_metadata") tx.setMetadata(val);
      else if (key === "double_spend_seen") tx.setIsDoubleSpend(val);
      else if (key === "confirmations") {
        if (!tx.getIsConfirmed()) tx.setNumConfirmations(0);
        else tx.setNumConfirmations(val);
      }
      else if (key === "suggested_confirmations_threshold") {
        if (tx.getIsMempool()) tx.setNumEstimatedBlocksUntilConfirmed(val);
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
      else LOGGER.warn("Ignoring unexpected transaction field: '" + key + "': " + val);
    }
    
    // initialize final fields
    if (tx.getPayments() !== undefined) assert(payment === undefined);
    else if (payment !== undefined) tx.setPayments([payment]);
    if (tx.getIsOutgoing()) {
      tx.setSrcAccountIndex(accountIdx);
      tx.setSrcSubaddressIndex(subaddressIdx);
    } else {
      assert(payment);
      assert.equal(1, tx.getPayments().length);
      payment.setAccountIndex(accountIdx);
      payment.setSubaddressIndex(subaddressIdx);
    }
    if (tx.getPayments() !== undefined && tx.getIsIncoming() && tx.getIsMempool()) {
      for (let aPayment of tx.getPayments()) aPayment.setIsSpent(false);  // incoming mempool payments are not spent
    }
    
    // return initialized transaction
    return tx;
  }
  
//  /**
//   * Initializes the tx type, state, and coinbase if applicable from a rpc type.
//   *
//   * @param rpcType is the type as reported from monero-wallet-rpc
//   * @param tx is the transaction to initialize from the type
//   */
//  static _initTxFromRpcType(rpcType, tx) {
//    if (rpcType === "in") {
//      tx.setType(MoneroTxWallet.Type.INCOMING);
//      tx.setState(MoneroTxWallet.State.CONFIRMED);
//    } else if (rpcType === "out") {
//      tx.setType(MoneroTxWallet.Type.OUTGOING);
//      tx.setState(MoneroTxWallet.State.CONFIRMED);
//    } else if (rpcType === "pending") {
//      tx.setType(MoneroTxWallet.Type.OUTGOING);
//      tx.setState(MoneroTxWallet.State.MEMPOOL);
//    } else if (rpcType === "pool") {
//      tx.setType(MoneroTxWallet.Type.INCOMING);
//      tx.setState(MoneroTxWallet.State.MEMPOOL);
//    } else if (rpcType === "block") {
//      tx.setType(MoneroTxWallet.Type.INCOMING);
//      tx.setState(MoneroTxWallet.State.CONFIRMED);
//      tx.setIsCoinbase(true);
//    } else if (rpcType === "failed") {
//      tx.setType(MoneroTxWallet.Type.OUTGOING);
//      tx.setState(MoneroTxWallet.State.MEMPOOL);
//    }
//    
//  }
///**
//* Decodes a "type" from monero-wallet-rpc.
//* 
//* @param rpcType is the type to decode
//* @returns {type: _, state: _, isCoinbase: _}
//*/
//static _decodeRpcType(rpcType) {
// let decoded = { isCoinbase: false };
// if (rpcType === "in") {
//   decoded.type = MoneroTxWallet.Type.INCOMING;
//   decoded.state = MoneroTxWallet.State.CONFIRMED;
// } else if (rpcType === "out") {
//   decoded.type = MoneroTxWallet.Type.OUTGOING;
//   decoded.state = MoneroTxWallet.State.CONFIRMED;
// } else if (rpcType === "pool") {
//   decoded.type = MoneroTxWallet.Type.INCOMING;
//   decoded.state = MoneroTxWallet.State.CONFIRMED;
// } else if (rpcType === "pending") {
//   decoded.type = MoneroTxWallet.Type.OUTGOING;
//   decoded.state = MoneroTxWallet.State.CONFIRMED;
// } else if (rpcType === "block") {
//   decoded.type = MoneroTxWallet.Type.INCOMING;
//   decoded.state = MoneroTxWallet.State.CONFIRMED;
//   decoded.isCoinbase = true;
// } else if (rpcType === "failed") {
//   decoded.type = MoneroTxWallet.Type.OUTGOING;
//   decoded.state = MoneroTxWallet.State.FAILED;
// }
// return decoded;
//}
  
  /**
   * Decodes a "type" from monero-wallet-rpc to initialize type and state
   * fields in the given transaction.
   * 
   * @param rpcType is the type to decode
   * @param tx is the transaction decode known fields to
   */
  static _decodeRpcType(rpcType, tx) {
    tx.setIsRelayed(true);
    tx.setIsCoinbase(false);
    tx.setIsFailed(false);
    if (rpcType === "in") {
      tx.setIsIncoming(true);
      tx.setIsConfirmed(true);
    } else if (rpcType === "out") {
      tx.setIsIncoming(false);
      tx.setIsConfirmed(true);
    } else if (rpcType === "pool") {
      tx.setIsIncoming(true);
      tx.setIsConfirmed(false);
    } else if (rpcType === "pending") {
      tx.setIsIncoming(false);
      tx.setIsConfirmed(false);
    } else if (rpcType === "block") {
      tx.setIsIncoming(true);
      tx.setIsConfirmed(true);
      tx.setIsCoinbase(true);
    } else if (rpcType === "failed") {
      tx.setIsIncoming(false);
      tx.setIsConfirmed(false);
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
}

module.exports = MoneroWalletRpc;