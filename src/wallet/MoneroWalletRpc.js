const assert = require("assert");
const MoneroRpc = require("../rpc/MoneroRpc");
const MoneroWallet = require("./MoneroWallet");
const MoneroSubaddress = require("./model/MoneroSubaddress");

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
  
  async refresh() {
    return await this.config.rpc.sendJsonRpcRequest("refresh");
  }
  
  async getLanguages() {
    return (await this.config.rpc.sendJsonRpcRequest("get_languages")).languages;
  }
  
  async getPrimaryAddress() {
    return (await this.config.rpc.sendJsonRpcRequest("get_address", { account_index: 0, address_index: 0 })).address;
  }
  
  async getIntegratedAddress(paymentId) {
    throw new Error("Not implemented");
  }
  async getAccounts(includeSubaddresses, tag) {
    throw new Error("Subclass must implement");
  }
  
  async getAccount(accountIdx, includeSubaddresses) {
    throw new Error("Not implemented");
  }

  async createAccount(label) {
    throw new Error("Not implemented");
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
      subaddress.setBalance(0);
      subaddress.setUnlockedBalance(0);
      subaddress.setNumUnspentOutputs(0);
    }
    
    // fetch and initialize subaddress balances
    resp = this.config.rpc.sendJsonRpcRequest("get_balance", params);
    let respSubaddresses = resp.per_subaddress;
    if (respSubaddresses) {
      for (let respSubaddress of respSubaddresses) {
        let subaddressIdx = respSubaddress.address_index;
        for (let subaddress of subaddresses) {
          if (subaddressIdx !== subaddress.getSubaddrIndex()) continue; // find matching subaddress
          assert.equal(subaddress.getAddress(), respSubaddress.address);
          if (respSubaddress.balance !== undefined) subaddress.setBalance(respSubaddress.balance);
          if (respSubaddress.unlocked_balance !== undefined) subaddress.setUnlockedBalance(respSubaddress.unlocked_balance);
          subaddress.setNumUnspentOutputs(respSubaddress.num_unspent_outputs);
        }
      }
    }
    
    // cache addresses TODO
//    Map<Integer, String> subaddressMap = addressCache.get(accountIdx);
//    if (subaddressMap == null) {
//      subaddressMap = new HashMap<Integer, String>();
//      addressCache.put(accountIdx, subaddressMap);
//    }
//    for (MoneroSubaddress subaddress : subaddresses) {
//      subaddressMap.put(subaddress.getSubaddrIndex(), subaddress.getAddress());
//    }
    
    // return results
    return subaddresses;
  }

  async getSubaddress(accountIdx, subaddressIdx) {
    assert(accountIdx >= 0);
    assert(subaddressIdx >= 0);
    return (await this.getSubaddresses(accountIdx, subaddressIdx))[0];
  }

  async createSubaddress(accountIdx, label) {
    throw new Error("Not implemented");
  }

  async getAddress(accountIdx, subaddressIdx) {
    throw new Error("Not implemented");
  }

  async getBalance() {
    throw new Error("Not implemented");
  }
  
  async getUnlockedBalance() {
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
    //adressCache.clear();  // TODO: for when you're at the point of caching addresses
  }
  
  async rescanSpent() {
    await this.config.rpc.sendJsonRpcRequest("rescan_spent", null);
  }
}

module.exports = MoneroWalletRpc;