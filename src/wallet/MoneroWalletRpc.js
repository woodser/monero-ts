const assert = require("assert");
const BigInteger = require("../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const GenUtils = require("../utils/GenUtils");
const MoneroUtils = require("../utils/MoneroUtils");
const MoneroRpc = require("../rpc/MoneroRpc");
const MoneroWallet = require("./MoneroWallet");
const MoneroIntegratedAddress = require("./model/MoneroIntegratedAddress");
const MoneroAccount = require("./model/MoneroAccount");
const MoneroSubaddress = require("./model/MoneroSubaddress");
const MoneroWalletTx = require("./model/MoneroWalletTx");
const MoneroTransfer = require("./model/MoneroTransfer");
const MoneroDestination = require("./model/MoneroDestination");
const MoneroWalletOutput = require("./model/MoneroWalletOutput");
const MoneroSendConfig = require("./model/MoneroSendConfig");
const MoneroCheckTx = require("./model/MoneroCheckTx");
const MoneroCheckReserve = require("./model/MoneroCheckReserve");
const MoneroTxFilter = require("./filters/MoneroTxFilter");
const MoneroTransferFilter = require("./filters/MoneroTransferFilter");
const MoneroVoutFilter = require("./filters/MoneroVoutFilter");

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
  
  async getTxs(config) {
    
    // initialize tx filter from config
    let txFilter;
    if (config instanceof MoneroTxFilter) txFilter = config;
    else {
      config = Object.assign({}, config);
      if (!config.id) config.id = config.txId;  // support txId TODO: move into MoneroTransaction?
      txFilter = new MoneroTxFilter(config);
    }
    if (!txFilter.getTransferFilter()) txFilter.setTransferFilter(new MoneroTransferFilter());
    let transferFilter = txFilter.getTransferFilter();
    
    // temporarily disable transfer filter
    txFilter.setTransferFilter(undefined);
    
    // fetch all transfers that meet tx filter
    let transfers = await this.getTransfers(new MoneroTransferFilter().setTxFilter(txFilter));  // TODO: {txFilter: txFilter} instead
    
    // collect unique txs from transfers
    let txs = Array.from(new Set(transfers.map(transfer => transfer.getTx())).values());
    
    // fetch and merge vouts if configured
    if (config.getVouts) {
      let vouts = await this.getVouts(new MoneroVoutFilter(config).setTxFilter(txFilter));
      let voutTxs = new Set();
      vouts.map(vout => voutTxs.add(vout.getTx()));
      for (let tx of voutTxs) MoneroWalletRpc._mergeTx(txs, tx, true);
    }
    
    // filter and return txs that meet transfer filter
    txFilter.setTransferFilter(transferFilter);
    return txFilter.apply(txs);
  }
  
  async getTransfers(config) {
    
    // initialize filters from config
    let transferFilter;
    if (config instanceof MoneroTransferFilter) transferFilter = config;
    else {
      config = Object.assign({}, config);
      if (!config.id) config.id = config.txId;  // support txId TODO: move into MoneroTransaction?
      transferFilter = new MoneroTransferFilter(config);
      transferFilter.setTxFilter(new MoneroTxFilter(config));
    }
    if (!transferFilter.getTransfer()) transferFilter.setTransfer(new MoneroTransfer());
    if (!transferFilter.getTxFilter()) transferFilter.setTxFilter(new MoneroTxFilter());
    if (!transferFilter.getTxFilter().getTx()) transferFilter.getTxFilter().setTx(new MoneroWalletTx());
    let transfer = transferFilter.getTransfer();
    let txFilter = transferFilter.getTxFilter();
    let tx = txFilter.getTx();
    
    // determine account and subaddress indices to be queried
    let indices = new Map();
    if (transfer.getAccountIndex() !== undefined) {
      let subaddressIndices = new Set();
      if (transfer.getSubaddressIndex() !== undefined) subaddressIndices.add(transfer.getSubaddressIndex());
      if (transferFilter.getSubaddressIndices() !== undefined) transferFilter.getSubaddressIndices().map(subaddressIdx => subaddressIndices.add(subaddressIdx));
      indices.set(transfer.getAccountIndex(), subaddressIndices.size ? Array.from(subaddressIndices) : await this._getSubaddressIndices(transfer.getAccountIndex()));  // TODO monero-wallet-rpc: support `get_tranfsers` getting all transfers in account so clients don't need to pre-fetch subaddress indices
    } else {
      assert.equal(undefined, transfer.getSubaddressIndex(), "Filter specifies a subaddress index but not an account index")
      assert(transferFilter.getSubaddressIndices() === undefined || transferFilter.getSubaddressIndices().length === 0, "Filter specifies subaddress indices but not an account index");
      indices = await this._getAccountIndices(true);  // fetch all account and subaddress indices
    }
    
    // build params for `get_transfers` rpc call
    let canBeConfirmed = tx.getIsConfirmed() !== false && tx.getInTxPool() !== true && tx.getIsFailed() !== true && tx.getIsRelayed() !== false;
    let canBeInTxPool = tx.getIsConfirmed() !== true && tx.getInTxPool() !== false && tx.getIsFailed() !== true & tx.getIsRelayed() !== false && tx.getHeight() === undefined && txFilter.getMinHeight() === undefined;
    let canBeIncoming = transferFilter.getIsIncoming() !== false && transferFilter.getIsOutgoing() !== true && transferFilter.getHasDestinations() !== true;
    let canBeOutgoing = transferFilter.getIsOutgoing() !== false && transferFilter.getIsIncoming() !== true;
    let params = {};
    params.in = canBeIncoming && canBeConfirmed;
    params.out = canBeOutgoing && canBeConfirmed;
    params.pool = canBeIncoming && canBeInTxPool;
    params.pending = canBeOutgoing && canBeInTxPool;
    params.failed = tx.getIsFailed() !== false && tx.getIsConfirmed() !== true && tx.getInTxPool() != true;
    if (txFilter.getMinHeight() !== undefined) params.min_height = txFilter.getMinHeight(); 
    if (txFilter.getMaxHeight() !== undefined) params.max_height = txFilter.getMaxHeight();
    params.filter_by_height = txFilter.getMinHeight() !== undefined || txFilter.getMaxHeight() !== undefined;
    
    // build txs using `get_transfers` for each indicated account
    let txs = [];
    for (let accountIdx of indices.keys()) {
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.config.rpc.sendJsonRequest("get_transfers", params);
      for (let key of Object.keys(resp)) {
        for (let rpcTx of resp[key]) {
          if (rpcTx.txid === config.debugTxId) console.log(rpcTx);
          let tx = MoneroWalletRpc._buildWalletTx(rpcTx);
          
          // replace transfer amount with destination sum
          // TODO monero-wallet-rpc: confirmed tx from/to same account has amount 0 but cached transfers
          if (tx.getOutgoingTransfer() !== undefined && tx.getIsRelayed() && !tx.getIsFailed() &&
              tx.getOutgoingTransfer().getDestinations() && tx.getOutgoingAmount().compare(new BigInteger(0)) === 0) {
            let outgoingTransfer = tx.getOutgoingTransfer();
            let transferTotal = new BigInteger(0);
            for (let destination of outgoingTransfer.getDestinations()) transferTotal = transferTotal.add(destination.getAmount());
            tx.getOutgoingTransfer().setAmount(transferTotal);
          }
          
          // merge tx
          MoneroWalletRpc._mergeTx(txs, tx);
        }
      }
    }
    
    // filter and return transfers
    let transfers = [];
    for (tx of txs) {
      if (transferFilter.meetsCriteria(tx.getOutgoingTransfer())) transfers.push(tx.getOutgoingTransfer());
      if (tx.getIncomingTransfers()) transferFilter.apply(tx.getIncomingTransfers()).map(transfer => transfers.push(transfer));
    }
    return transfers;
  }
  
  async getVouts(config) {
    
    // initialize filters from config
    let voutFilter;
    if (config instanceof MoneroVoutFilter) voutFilter = config;
    else {
      config = Object.assign({}, config);
      if (!config.id) config.id = config.txId;  // support txId TODO: move into MoneroTransaction?
      voutFilter = new MoneroVoutFilter(config);
      voutFilter.setTxFilter(new MoneroTxFilter(config));
    }
    if (!voutFilter.getVout()) voutFilter.setVout(new MoneroVout());
    if (!voutFilter.getTxFilter()) voutFilter.setTxFilter(new MoneroTxFilter());
    if (!voutFilter.getTxFilter().getTx()) voutFilter.getTxFilter().setTx(new MoneroWalletTx());
    let vout = voutFilter.getVout();
    let txFilter = voutFilter.getTxFilter();
    let tx = txFilter.getTx();
    
    // determine account and subaddress indices to be queried
    let indices = new Map();
    if (vout.getAccountIndex() !== undefined) {
      let subaddressIndices = new Set();
      if (vout.getSubaddressIndex() !== undefined) subaddressIndices.add(vout.getSubaddressIndex());
      if (voutFilter.getSubaddressIndices() !== undefined) voutFilter.getSubaddressIndices().map(subaddressIdx => subaddressIndices.add(subaddressIdx));
      indices.set(vout.getAccountIndex(), subaddressIndices.size ? Array.from(subaddressIndices) : undefined);  // undefined will fetch from all subaddresses
    } else {
      assert.equal(undefined, vout.getSubaddressIndex(), "Filter specifies a subaddress index but not an account index")
      assert(voutFilter.getSubaddressIndices() === undefined || voutFilter.getSubaddressIndices().length === 0, "Filter specifies subaddress indices but not an account index");
      indices = await this._getAccountIndices();  // fetch all account indices without subaddresses
    }
    
    // collect txs with vouts for each indicated account using `incoming_transfers` rpc call
    let txs = [];
    let params = {};
    params.transfer_type = vout.getIsSpent() === undefined ? "all" : vout.getIsSpent() ? "unavailable" : "available";
    params.verbose = true;
    for (let accountIdx of indices.keys()) {
    
      // send request
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.config.rpc.sendJsonRequest("incoming_transfers", params);
      
      // convert response to txs with vouts and merge
      if (resp.transfers === undefined) continue;
      for (let rpcVout of resp.transfers) {
        let tx = MoneroWalletRpc._buildWalletTxVout(rpcVout);
        MoneroWalletRpc._mergeTx(txs, tx);
      }
    }
    
    // filter and return vouts
    let vouts = [];
    for (tx of txs) {
      voutFilter.apply(tx.getVouts()).map(vout => vouts.push(vout));
    }
    return vouts;
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
    params.address = config.getTransfers()[0].getAddress();
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
          MoneroWalletRpc._buildSentWalletTxs(resp, respTxs);
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
        MoneroWalletRpc._buildSentWalletTxs(resp, respTxs);
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
    
    // relay transactions and collect submission timestamps
    let txLastRelayedTimes = []
    for (let tx of txs)  {
      let resp = await this.config.rpc.sendJsonRequest("relay_tx", { hex: tx.getMetadata() });
      txLastRelayedTimes.push(+new Date().getTime()); // TODO (monero-wallet-rpc): provide timestamp on response
    }
    
    // build relayed txs from given txs 
    let relayedTxs = [];
    for (let i = 0; i < txs.length; i++) {
      let relayedTx = txs[i].copy();
      relayedTxs.push(relayedTx);
      relayedTx.setInTxPool(true);
      relayedTx.setDoNotRelay(false);
      relayedTx.setIsRelayed(true);
      relayedTx.setIsCoinbase(false);
      relayedTx.setIsFailed(false);
      relayedTx.setIsDoubleSpend(false);
      relayedTx.setLastRelayedTime(txLastRelayedTimes[i]);
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
  
  async _getAccountIndices(getSubaddressIndices) {
    let indices = new Map();
    for (let account of await this.getAccounts()) { // TODO: fetches unecessary address information when not necessary, expose raw getAccountIndices(), getSubaddressIndices() so cliens can be more efficient?
      indices.set(account.getIndex(), getSubaddressIndices ? await this._getSubaddressIndices(account.getIndex()) : undefined);
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
    let transfer;
    let accountIdx;
    let subaddressIdx;
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
        if (transfer === undefined) transfer = new MoneroTransfer({tx: tx});
        transfer.setAmount(new BigInteger(val));
      }
      else if (key === "address") {
        if (transfer === undefined) transfer = new MoneroTransfer({tx: tx});
        transfer.setAddress(val);
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
        let destinations = [];
        for (let rpcDestination of val) {
          let destination = new MoneroDestination();
          destinations.push(destination);
          for (let destinationKey of Object.keys(rpcDestination)) {
            if (destinationKey === "address") destination.setAddress(rpcDestination[destinationKey]);
            else if (destinationKey === "amount") destination.setAmount(new BigInteger(rpcDestination[destinationKey]));
            else throw new Error("Unrecognized transaction destination field: " + destinationKey);
          }
        }
        if (transfer === undefined) transfer = new MoneroTransfer({tx: tx});
        transfer.setDestinations(destinations);
      }
      else if (key === "multisig_txset" && !val) {} // TODO: handle this with value
      else if (key === "unsigned_txset" && !val) {} // TODO: handle this with value
      else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }
    
    // initialize final fields
    if (transfer) {
      transfer.setAccountIndex(accountIdx);
      transfer.setSubaddressIndex(subaddressIdx);
      if (isOutgoing) {
        if (tx.getOutgoingTransfer()) tx.getOutgoingTransfer().merge(transfer);
        else tx.setOutgoingTransfer(transfer);
      } else {
        tx.setIncomingTransfers([transfer]);
      }
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
    let vout = new MoneroWalletOutput({tx: tx});
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
   * Initializes sent MoneroWalletTx[] from a list of rpc txs.
   * 
   * @param rpcTxs are sent rpc txs to initialize the MoneroTxWallets from
   * @param txs are existing txs to initialize (optional)
   */
  static _buildSentWalletTxs(rpcTxs, txs) {
    
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
      if (tx.getOutgoingTransfer()) tx.getOutgoingTransfer().setAmount(new BigInteger(amounts[i]));
      else tx.setOutgoingTransfer(new MoneroTransfer({tx: tx, amount: new BigInteger(amounts[i])}));
    }
    return txs;
  }
  
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
   * @returns the merged tx
   */
  static _mergeTx(txs, tx, skipIfAbsent) {
    assert(tx.getId());
    for (let aTx of txs) {
      if (aTx.getId() === tx.getId()) {
        aTx.merge(tx);
        return aTx;
      }
    }
    
    // add tx if it doesn't already exist unless skipped
    if (!skipIfAbsent) {
      txs.push(tx);
      return tx;
    } else {
      console.log("WARNING: tx does not already exist"); 
    }
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
    for (let destination of config.getDestinations()) {
      assert(destination.getAddress(), "Destination address is not defined");
      assert(destination.getAmount(), "Destination amount is not defined");
      params.destinations.push({ address: destination.getAddress(), amount: destination.getAmount().toString() });
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
      tx.setDoNotRelay(config.getDoNotRelay() ? true : false);
      tx.setIsRelayed(!tx.getDoNotRelay());
      tx.setIsCoinbase(false);
      tx.setIsFailed(false);
      tx.setMixin(config.getMixin());
      let transfer = new MoneroTransfer({tx: tx});
      transfer.setAddress(await this.getAddress(accountIdx, 0));
      transfer.setAccountIndex(accountIdx);
      transfer.setSubaddressIndex(0); // TODO (monero-wallet-rpc): outgoing subaddress idx is always 0
      transfer.setDestinations(config.getDestinations());
      tx.setOutgoingTransfer(transfer);
      tx.setPaymentId(config.getPaymentId());
      if (tx.getUnlockTime() === undefined) tx.setUnlockTime(config.getUnlockTime() === undefined ? 0 : config.getUnlockTime());
      if (!tx.getDoNotRelay()) {
        if (tx.getLastRelayedTime() === undefined) tx.setLastRelayedTime(+new Date().getTime());  // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
        if (tx.getIsDoubleSpend() === undefined) tx.setIsDoubleSpend(false);
      }
    }
    
    // initialize txs from rpc response
    if (split) MoneroWalletRpc._buildSentWalletTxs(rpcResp, txs);
    else MoneroWalletRpc._buildWalletTx(rpcResp, txs[0], true);
    
    for (let tx of txs) {
      assert(tx.getOutgoingTransfer());
      assert(tx.getOutgoingTransfer().getAccountIndex() >= 0);
    }
    
    // return array or element depending on split
    return split ? txs : txs[0];
  }
}

module.exports = MoneroWalletRpc;