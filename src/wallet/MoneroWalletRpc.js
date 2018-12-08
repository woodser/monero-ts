const assert = require("assert");
const GenUtils = require("../utils/GenUtils");
const MoneroRpc = require("../rpc/MoneroRpc");
const MoneroWallet = require("./MoneroWallet");
const MoneroIntegratedAddress = require("./model/MoneroIntegratedAddress");
const MoneroAccount = require("./model/MoneroAccount");
const MoneroSubaddress = require("./model/MoneroSubaddress");
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
      subaddress.setSubaddrIndex(respAddress.address_index);
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
          if (subaddressIdx !== subaddress.getSubaddrIndex()) continue; // find matching subaddress
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
      subaddressMap[subaddress.getSubaddrIndex()] = subaddress.getAddress();
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
    subaddress.setSubaddrIndex(resp.address_index);
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
      return this.getAddress(accountIdx, subaddressIdx);  // uses cache
    }
    let address = subaddressMap[subaddressIdx];
    if (!address) {
      await this.getSubaddresses(accountIdx);             // cache's all addresses at this account
      return this.getAddress(accountIdx, subaddressIdx);  // uses cache
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
      if (subaddressIdx !== undefined) assert(subaddressIdx >= 0, "Subaddress must be >= 0 but was " + subaddressIdx);
      filter.setSubaddrIndex(subaddressIdx);
    } else throw new Error("First parameter must be MoneroTxFilter or account index >= 0 but was " + filterOrAccountIdx);
    
    
    
    
//    // stores merged txs across calls
//    List<MoneroTx> txs = new ArrayList<MoneroTx>();    
//    
//    // determine account and subaddress indices to be queried
//    Map<Integer, List<Integer>> indices = new HashMap<Integer, List<Integer>>();
//    if (filter.getAccountIndex() != null) {
//      indices.put(filter.getAccountIndex(), filter.getSubaddressIndices() == null || filter.getSubaddressIndices().isEmpty() ? getSubaddressIndices(filter.getAccountIndex()) : new ArrayList<Integer>(filter.getSubaddressIndices()));
//    } else {
//      if (filter.getSubaddressIndices() != null) throw new RuntimeException("Filter specifies subaddress indices but not an account index");
//      indices = getAllAccountAndSubaddressIndices();
//    }
//    
//    // build common params for get_transfers
//    Map<String, Object> params = new HashMap<String, Object>();
//    params.put("in", filter.isIncoming());
//    params.put("out", filter.isOutgoing());
//    params.put("pending", filter.isPending());
//    params.put("failed", filter.isFailed());
//    params.put("pool", filter.isMempool());
//    params.put("filter_by_height", filter.getMinHeight() != null || filter.getMaxHeight() != null);
//    if (filter.getMinHeight() != null) params.put("min_height", filter.getMinHeight());
//    if (filter.getMaxHeight() != null) params.put("max_height", filter.getMaxHeight());
//    
//    // get transactions using get_transfers
//    for (Integer accountIdx : indices.keySet()) {
//      params.put("account_index", accountIdx);
//      params.put("subaddr_indices", indices.get(accountIdx));
//      Map<String, Object> respMap = rpc.sendRpcRequest("get_transfers", params);
//      Map<String, Object> result = (Map<String, Object>) respMap.get("result");
//      for (String key : result.keySet()) {
//        for (Map<String, Object> txMap : (List<Map<String, Object>>) result.get(key)) {
//          MoneroTx tx = txMapToTx(txMap, this);
//          if (MoneroUtils.isIncoming(tx.getType()) && MoneroUtils.isConfirmed(tx.getType())) {  // prevent duplicates when populated by incoming_transfers  // TODO (monero-wallet-rpc): merge payments when incoming txs work (https://github.com/monero-project/monero/issues/4500)
//            tx.setTotalAmount(BigInteger.valueOf(0));
//            tx.setPayments(null);
//          }
//          addTx(txs, tx, false);
//        }
//      }
//    }
//    
//    // get incoming transactions
//    if (filter.isIncoming()) {
//      
//      // get transactions using incoming_transfers
//      params.clear();
//      params.put("transfer_type", "all"); // TODO: suppport all | available | unavailable 'types' which is different from MoneroTxType
//      for (Integer accountIdx : indices.keySet()) {
//        params.put("account_index", accountIdx);
//        params.put("subaddr_indices", filter.getSubaddressIndices()); // null subaddr_indices will fetch all incoming_transfers
//        Map<String, Object> respMap = rpc.sendRpcRequest("incoming_transfers", params);
//        Map<String, Object> result = (Map<String, Object>) respMap.get("result");
//
//        // interpret incoming_transfers response
//        List<Map<String, Object>> txMaps = (List<Map<String, Object>>) result.get("transfers");
//        if (txMaps != null) {
//          for (Map<String, Object> txMap : txMaps) {
//            
//            // convert map to tx and assign address
//            MoneroTx tx = txMapToTx(txMap, MoneroTxType.INCOMING, this);
//            String address = getAddress(accountIdx, tx.getPayments().get(0).getSubaddrIndex());
//            tx.getPayments().get(0).setAddress(address);
//            
//            // assign block type if applicable, which 'incoming_transfers' does not provide
//            for (MoneroTx allTx : txs) {
//              if (allTx.getType() == MoneroTxType.BLOCK && allTx.getId().equals(tx.getId())) {
//                tx.setType(allTx.getType());
//              }
//            }
//            
//            // add tx to existing txs
//            addTx(txs, tx, false);
//          }
//        }
//      }
//    }
//
//    // filter final result
//    Collection<MoneroTx> toRemoves = new HashSet<MoneroTx>();
//    for (MoneroTx tx : txs) {
//      if (filter.getPaymentIds() != null && !filter.getPaymentIds().contains(tx.getPaymentId())) toRemoves.add(tx);
//      else if (filter.getTxIds() != null && !filter.getTxIds().contains(tx.getId())) toRemoves.add(tx);
//      else if (filter.getMinHeight() != null && (tx.getHeight() == null || tx.getHeight() < filter.getMinHeight())) toRemoves.add(tx);
//      else if (filter.getMaxHeight() != null && (tx.getHeight() == null || tx.getHeight() > filter.getMaxHeight())) toRemoves.add(tx);
//      else if (Boolean.TRUE.equals(filter.getHasPayments()) && (tx.getPayments() == null || tx.getPayments().isEmpty())) toRemoves.add(tx);
//      else if (Boolean.FALSE.equals(filter.getHasPayments()) && tx.getPayments() != null && !tx.getPayments().isEmpty()) toRemoves.add(tx);
//    }
//    txs.removeAll(toRemoves);
//    return txs;
    
    
    
    
    
    throw new Error("Not implemented");
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
    await this.config.rpc.sendJsonRpcRequest("rescan_spent", null);
  }
}

module.exports = MoneroWalletRpc;