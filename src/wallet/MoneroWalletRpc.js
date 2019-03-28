const assert = require("assert");
const Filter = require("../utils/Filter");
const BigInteger = require("../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const GenUtils = require("../utils/GenUtils");
const MoneroUtils = require("../utils/MoneroUtils");
const MoneroError = require("../utils/MoneroError");
const MoneroRpc = require("../rpc/MoneroRpc");
const MoneroBlock = require("../daemon/model/MoneroBlock");
const MoneroBlockHeader = require("../daemon/model/MoneroBlockHeader");
const MoneroWallet = require("./MoneroWallet");
const MoneroSyncResult = require('./model/MoneroSyncResult');
const MoneroIntegratedAddress = require("./model/MoneroIntegratedAddress");
const MoneroAccount = require("./model/MoneroAccount");
const MoneroSubaddress = require("./model/MoneroSubaddress");
const MoneroTxWallet = require("./model/MoneroTxWallet");
const MoneroTransfer = require("./model/MoneroTransfer");
const MoneroDestination = require("./model/MoneroDestination");
const MoneroOutputWallet = require("./model/MoneroOutputWallet");
const MoneroSendConfig = require("./config/MoneroSendConfig");
const MoneroCheckTx = require("./model/MoneroCheckTx");
const MoneroCheckReserve = require("./model/MoneroCheckReserve");
const MoneroTxFilter = require("./config/MoneroTxFilter");
const MoneroTransferFilter = require("./config/MoneroTransferFilter");
const MoneroVoutFilter = require("./config/MoneroVoutFilter");
const MoneroAccountTag = require("./model/MoneroAccountTag");
const MoneroAddressBookEntry = require("./model/MoneroAddressBookEntry");
const MoneroKeyImage = require("../daemon/model/MoneroKeyImage");
const MoneroKeyImageImportResult = require("./model/MoneroKeyImageImportResult");

/**
 * Implements a Monero wallet using monero-wallet-rpc.
 */
class MoneroWalletRpc extends MoneroWallet {
  
  /**
   * Constructs the wallet rpc instance.
   * 
   * @param {object}  config defines the rpc configuration
   * @param {string}  config.uri is the uri of the rpc endpoint
   * @param {string}  config.protocol is the protocol of the rpc endpoint
   * @param {string}  config.host is the host of the rpc endpoint
   * @param {int}     config.port is the port of the rpc endpoint
   * @param {string}  config.user is a username to authenticate with the rpc endpoint
   * @param {string}  config.password is a password to authenticate with the rpc endpoint
   * @param {string}  config.maxRequestsPerSecond is the maximum requests per second to allow
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
  
  // --------------------------- RPC WALLET METHODS ---------------------------

  /**
   * Rescan the blockchain for spent outputs.
   */
  async rescanSpent() {
    await this.config.rpc.sendJsonRequest("rescan_spent");
  }
  
  /**
   * Rescan the blockchain from scratch, losing any information which can not
   * be recovered from the blockchain itself.
   * 
   * WARNING: This method discards local wallet data like destination
   * addresses, tx secret keys, tx notes, etc.
   */
  async rescanBlockchain() {
    await this.config.rpc.sendJsonRequest("rescan_blockchain");
  }
  
  /**
   * Create a new wallet file at the remote endpoint.
   * 
   * @param {string} filename is the name of the wallet file to create
   * @param {string} password is the password to decrypt the wallet file
   * @param {string} language is the language for the wallet's mnemonic seed
   */
  async createWallet(filename, password, language) {
    if (!filename) throw new MoneroError("Filename is not initialized");
    if (!password) throw new MoneroError("Password is not initialized");
    if (!language) throw new MoneroError("Language is not initialized");
    let params = { filename: filename, password: password, language: language };
    await this.config.rpc.sendJsonRequest("create_wallet", params);
  }
  
  /**
   * Open a wallet file at the remote endpoint.
   * 
   * @param {string} filename is the name of the wallet file to open
   * @param {string} password is the password to decrypt the wallet file
   */
  async openWallet(filename, password) {
    if (!filename) throw new MoneroError("Filename is not initialized");
    if (!password) throw new MoneroError("Password is not initialized");
    await this.config.rpc.sendJsonRequest("open_wallet", {filename: filename, password: password});
    delete this.addressCache;
    this.addressCache = {};
  }
  
  /**
   * Save the currently open wallet file at the remote endpoint.
   */
  async save() {
    await this.config.rpc.sendJsonRequest("store");
  }
  
  /**
   * Close the wallet at the remote endpoint, saving the current state.
   */
  async close() {
    await this.config.rpc.sendJsonRequest("stop_wallet");
    delete this.addressCache;
    this.addressCache = {};
  }
  
  // -------------------------- COMMON WALLET METHODS -------------------------
  
  async getMnemonic() {
    let resp = await this.config.rpc.sendJsonRequest("query_key", { key_type: "mnemonic" });
    return resp.result.key;
  }
  
  async getPrivateViewKey() {
    let resp = await this.config.rpc.sendJsonRequest("query_key", { key_type: "view_key" });
    return resp.result.key;
  }

  async getLanguages() {
    return (await this.config.rpc.sendJsonRequest("get_languages")).result.languages;
  }
  
  async getHeight() {
    return (await this.config.rpc.sendJsonRequest("get_height")).result.height;
  }
  
  async getPrimaryAddress() {
    return (await this.config.rpc.sendJsonRequest("get_address", {account_index: 0, address_index: 0})).result.address;
  }
  
  async getIntegratedAddress(paymentId) {
    let integratedAddressStr = (await this.config.rpc.sendJsonRequest("make_integrated_address", {payment_id: paymentId})).result.integrated_address;
    return await this.decodeIntegratedAddress(integratedAddressStr);
  }
  
  async decodeIntegratedAddress(integratedAddress) {
    let resp = await this.config.rpc.sendJsonRequest("split_integrated_address", {integrated_address: integratedAddress});
    return new MoneroIntegratedAddress(resp.result.standard_address, resp.result.payment_id, integratedAddress);
  }
  
  async sync(startHeight, endHeight, onProgress) {
    assert(endHeight === undefined, "Monero Wallet RPC does not support syncing to an end height");
    assert(onProgress === undefined, "Monero Wallet RPC does not support reporting sync progress");
    let resp = await this.config.rpc.sendJsonRequest("refresh", {start_height: startHeight});
    return new MoneroSyncResult(resp.result.blocks_fetched, resp.result.received_money);
  }
  
  async isMultisigImportNeeded() {
    let resp = await this.config.rpc.sendJsonRequest("get_balance");
    return resp.result.multisig_import_needed === true;
  }
  
  async getAccounts(includeSubaddresses, tag, skipBalances) {
    
    // fetch accounts from rpc
    let resp = await this.config.rpc.sendJsonRequest("get_accounts", {tag: tag});
    
    // build account objects and fetch subaddresses per account using get_address
    // TODO monero-wallet-rpc: get_address should support all_accounts so not called once per account
    let accounts = [];
    for (let rpcAccount of resp.result.subaddress_accounts) {
      let account = MoneroWalletRpc._convertRpcAccount(rpcAccount);
      if (includeSubaddresses) account.setSubaddresses(await this.getSubaddresses(account.getIndex(), undefined, true));
      accounts.push(account);
    }
    
    // fetch and merge fields from get_balance across all accounts
    if (includeSubaddresses && !skipBalances) {
      
      // these fields are not returned from rpc if 0 so pre-initialize them
      for (let account of accounts) {
        for (let subaddress of account.getSubaddresses()) {
          subaddress.setBalance(new BigInteger(0));
          subaddress.setUnlockedBalance(new BigInteger(0));
          subaddress.setNumUnspentOutputs(0);
        }
      }
      
      // fetch and merge info from get_balance
      resp = await this.config.rpc.sendJsonRequest("get_balance", {all_accounts: true});
      if (resp.result.per_subaddress) {
        for (let rpcSubaddress of resp.result.per_subaddress) {
          let subaddress = MoneroWalletRpc._convertRpcSubaddress(rpcSubaddress);
          
          // merge info
          let account = accounts[subaddress.getAccountIndex()];
          assert.equal(subaddress.getAccountIndex(), account.getIndex(), "RPC accounts are out of order");  // would need to switch lookup to loop
          let tgtSubaddress = account.getSubaddresses()[subaddress.getIndex()];
          assert.equal(subaddress.getIndex(), tgtSubaddress.getIndex(), "RPC subaddresses are out of order");
          if (subaddress.getBalance() !== undefined) tgtSubaddress.setBalance(subaddress.getBalance());
          if (subaddress.getUnlockedBalance() !== undefined) tgtSubaddress.setUnlockedBalance(subaddress.getUnlockedBalance());
          if (subaddress.getNumUnspentOutputs() !== undefined) tgtSubaddress.setNumUnspentOutputs(subaddress.getNumUnspentOutputs());
        }
      }
    }
    
    // return accounts
    return accounts;
  }
  
  // TODO: getAccountByIndex(), getAccountByTag()
  async getAccount(accountIdx, includeSubaddresses, skipBalances) {
    assert(accountIdx >= 0);
    for (let account of await this.getAccounts()) {
      if (account.getIndex() === accountIdx) {
        if (includeSubaddresses) account.setSubaddresses(await this.getSubaddresses(accountIdx, undefined, skipBalances));
        return account;
      }
    }
    throw new Exception("Account with index " + accountIdx + " does not exist");
  }

  async createAccount(label) {
    label = label ? label : undefined;
    let resp = await this.config.rpc.sendJsonRequest("create_account", {label: label});
    return new MoneroAccount(resp.result.account_index, resp.result.address, label, new BigInteger(0), new BigInteger(0));
  }

  async getSubaddresses(accountIdx, subaddressIndices, skipBalances) {
    
    // fetch subaddresses
    let params = {};
    params.account_index = accountIdx;
    if (subaddressIndices) params.address_index = GenUtils.listify(subaddressIndices);
    let resp = await this.config.rpc.sendJsonRequest("get_address", params);
    
    // initialize subaddresses
    let subaddresses = [];
    for (let rpcSubaddress of resp.result.addresses) {
      let subaddress = MoneroWalletRpc._convertRpcSubaddress(rpcSubaddress);
      subaddress.setAccountIndex(accountIdx);
      subaddresses.push(subaddress);
    }
    
    // fetch and initialize subaddress balances
    if (!skipBalances) {
      
      // these fields are not returned from rpc if 0 so pre-initialize them
      for (let subaddress of subaddresses) {
        subaddress.setBalance(new BigInteger(0));
        subaddress.setUnlockedBalance(new BigInteger(0));
        subaddress.setNumUnspentOutputs(0);
      }

      // fetch and initialize balances
      resp = await this.config.rpc.sendJsonRequest("get_balance", params);
      if (resp.result.per_subaddress) {
        for (let rpcSubaddress of resp.result.per_subaddress) {
          let subaddress = MoneroWalletRpc._convertRpcSubaddress(rpcSubaddress);
          
          // transfer info to existing subaddress object
          for (let tgtSubaddress of subaddresses) {
            if (tgtSubaddress.getIndex() !== subaddress.getIndex()) continue; // skip to subaddress with same index
            if (subaddress.getBalance() !== undefined) tgtSubaddress.setBalance(subaddress.getBalance());
            if (subaddress.getUnlockedBalance() !== undefined) tgtSubaddress.setUnlockedBalance(subaddress.getUnlockedBalance());
            if (subaddress.getNumUnspentOutputs() !== undefined) tgtSubaddress.setNumUnspentOutputs(subaddress.getNumUnspentOutputs());
          }
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
      subaddressMap[subaddress.getIndex()] = subaddress.getAddress();
    }
    
    // return results
    return subaddresses;
  }

  async getSubaddress(accountIdx, subaddressIdx, skipBalances) {
    assert(accountIdx >= 0);
    assert(subaddressIdx >= 0);
    return (await this.getSubaddresses(accountIdx, subaddressIdx, skipBalances))[0];
  }

  async createSubaddress(accountIdx, label) {
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest("create_address", {account_index: accountIdx, label: label});
    
    // build subaddress object
    let subaddress = new MoneroSubaddress();
    subaddress.setAccountIndex(accountIdx);
    subaddress.setIndex(resp.result.address_index);
    subaddress.setAddress(resp.result.address);
    subaddress.setLabel(label ? label : undefined);
    subaddress.setBalance(new BigInteger(0));
    subaddress.setUnlockedBalance(new BigInteger(0));
    subaddress.setNumUnspentOutputs(0);
    subaddress.setIsUsed(false);
    return subaddress;
  }

  async getAddress(accountIdx, subaddressIdx) {
    let subaddressMap = this.addressCache[accountIdx];
    if (!subaddressMap) {
      await this.getSubaddresses(accountIdx, undefined, true);  // cache's all addresses at this account
      return this.getAddress(accountIdx, subaddressIdx);        // recursive call uses cache
    }
    let address = subaddressMap[subaddressIdx];
    if (!address) {
      await this.getSubaddresses(accountIdx, undefined, true);  // cache's all addresses at this account
      return this.addressCache[accountIdx][subaddressIdx];
    }
    return address;
  }
  
  // TODO: use cache
  async getAddressIndex(address) {
    let resp;
    try {
      resp = await this.config.rpc.sendJsonRequest("get_address_index", {address: address});
    } catch (e) {
      if (e.getCode() === -2) throw new MoneroError("Address does not belong to the wallet");
      throw e;
    }
    let subaddress = new MoneroSubaddress(address);
    subaddress.setAccountIndex(resp.result.index.major);
    subaddress.setIndex(resp.result.index.minor);
    return subaddress;
  }
  
  async getBalance(accountIdx, subaddressIdx) {
    return (await this._getBalances(accountIdx, subaddressIdx))[0];
  }
  
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    return (await this._getBalances(accountIdx, subaddressIdx))[1];
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
    let transfers = await this.getTransfers(new MoneroTransferFilter().setTxFilter(txFilter));  // TODO: {txFilter: txFilter} instead, need to resolve circular filter imports, also pass debugTxId here
    
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
    return Filter.apply(txFilter, txs);
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
    if (!transferFilter.getTxFilter()) transferFilter.setTxFilter(new MoneroTxFilter());
    let txFilter = transferFilter.getTxFilter();
    
    // build params for get_transfers rpc call
    let params = {};
    let canBeConfirmed = txFilter.getIsConfirmed() !== false && txFilter.getInTxPool() !== true && txFilter.getIsFailed() !== true && txFilter.getIsRelayed() !== false;
    let canBeInTxPool = txFilter.getIsConfirmed() !== true && txFilter.getInTxPool() !== false && txFilter.getIsFailed() !== true & txFilter.getIsRelayed() !== false && txFilter.getHeight() === undefined && txFilter.getMinHeight() === undefined;
    let canBeIncoming = transferFilter.getIsIncoming() !== false && transferFilter.getIsOutgoing() !== true && transferFilter.getHasDestinations() !== true;
    let canBeOutgoing = transferFilter.getIsOutgoing() !== false && transferFilter.getIsIncoming() !== true;
    params.in = canBeIncoming && canBeConfirmed;
    params.out = canBeOutgoing && canBeConfirmed;
    params.pool = canBeIncoming && canBeInTxPool;
    params.pending = canBeOutgoing && canBeInTxPool;
    params.failed = txFilter.getIsFailed() !== false && txFilter.getIsConfirmed() !== true && txFilter.getInTxPool() != true;
    if (txFilter.getMinHeight() !== undefined) params.min_height = txFilter.getMinHeight(); 
    if (txFilter.getMaxHeight() !== undefined) params.max_height = txFilter.getMaxHeight();
    params.filter_by_height = txFilter.getMinHeight() !== undefined || txFilter.getMaxHeight() !== undefined;
    if (transferFilter.getAccountIndex() === undefined) {
      assert(transferFilter.getSubaddressIndex() === undefined && transferFilter.getSubaddressIndices() === undefined, "Filter specifies a subaddress index but not an account index");
      params.all_accounts = true;
    } else {
      params.account_index = transferFilter.getAccountIndex();
      
      // set subaddress indices param
      let subaddressIndices = new Set();
      if (transferFilter.getSubaddressIndex() !== undefined) subaddressIndices.add(transferFilter.getSubaddressIndex());
      if (transferFilter.getSubaddressIndices() !== undefined) transferFilter.getSubaddressIndices().map(subaddressIdx => subaddressIndices.add(subaddressIdx));
      if (subaddressIndices.size) params.subaddr_indices = Array.from(subaddressIndices);
    }
    
    // build txs using `get_transfers`
    let txs = [];
    let resp = await this.config.rpc.sendJsonRequest("get_transfers", params);
    for (let key of Object.keys(resp.result)) {
      for (let rpcTx of resp.result[key]) {
        if (rpcTx.txid === config.debugTxId) console.log(rpcTx);
        let tx = MoneroWalletRpc._convertRpcTxWallet(rpcTx);
        
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
    
    // filter and return transfers
    let transfers = [];
    for (let tx of txs) {
      if (transferFilter.meetsCriteria(tx.getOutgoingTransfer())) transfers.push(tx.getOutgoingTransfer());
      if (tx.getIncomingTransfers()) Filter.apply(transferFilter, tx.getIncomingTransfers()).map(transfer => transfers.push(transfer));
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
    if (!voutFilter.getTxFilter()) voutFilter.setTxFilter(new MoneroTxFilter());
    
    // determine account and subaddress indices to be queried
    let indices = new Map();
    if (voutFilter.getAccountIndex() !== undefined) {
      let subaddressIndices = new Set();
      if (voutFilter.getSubaddressIndex() !== undefined) subaddressIndices.add(voutFilter.getSubaddressIndex());
      if (voutFilter.getSubaddressIndices() !== undefined) voutFilter.getSubaddressIndices().map(subaddressIdx => subaddressIndices.add(subaddressIdx));
      indices.set(voutFilter.getAccountIndex(), subaddressIndices.size ? Array.from(subaddressIndices) : undefined);  // undefined will fetch from all subaddresses
    } else {
      assert.equal(voutFilter.getSubaddressIndex(), undefined, "Filter specifies a subaddress index but not an account index")
      assert(voutFilter.getSubaddressIndices() === undefined || voutFilter.getSubaddressIndices().length === 0, "Filter specifies subaddress indices but not an account index");
      indices = await this._getAccountIndices();  // fetch all account indices without subaddresses
    }
    
    // collect txs with vouts for each indicated account using `incoming_transfers` rpc call
    let txs = [];
    let params = {};
    params.transfer_type = voutFilter.getIsSpent() === undefined ? "all" : voutFilter.getIsSpent() ? "unavailable" : "available";
    params.verbose = true;
    for (let accountIdx of indices.keys()) {
    
      // send request
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.config.rpc.sendJsonRequest("incoming_transfers", params);
      
      // convert response to txs with vouts and merge
      if (resp.result.transfers === undefined) continue;
      for (let rpcVout of resp.result.transfers) {
        let tx = MoneroWalletRpc._convertRpcTxWalletVout(rpcVout);
        MoneroWalletRpc._mergeTx(txs, tx);
      }
    }
    
    // filter and return vouts
    let vouts = [];
    for (let tx of txs) {
      Filter.apply(voutFilter, tx.getVouts()).map(vout => vouts.push(vout));
    }
    return vouts;
  }
  
  async getKeyImages() {
    return await this._getKeyImages(true);
  }
  
  async importKeyImages(keyImages) {
    
    // send request
    let keyImagesParam = keyImages.map(keyImage => ({key_image: keyImage.getHex(), signature: keyImage.getSignature()}));
    let resp = await this.config.rpc.sendJsonRequest("import_key_images", {signed_key_images: keyImagesParam});
    
    // build and return result
    let result = new MoneroKeyImageImportResult();
    result.setHeight(resp.result.height);
    result.setSpentAmount(new BigInteger(resp.result.spent));
    result.setUnspentAmount(new BigInteger(resp.result.unspent));
    return result;
  }
  
  async getNewKeyImagesFromLastImport() {
    return await this._getKeyImages(false);
  }
  
  async send(configOrAddress, amount, priority, mixin) {
    let args = [].slice.call(arguments);
    args.splice(0, 0, false);  // specify splitting
    return await this._send.apply(this, args);
  }

  async sendSplit(configOrAddress, amount, priority, mixin) {
    let args = [].slice.call(arguments);
    args.splice(0, 0, true);  // specify splitting
    return await this._send.apply(this, args);
  }
  
  async sweepUnlocked(config) {
    
    // normalize and validate config
    if (!(config instanceof MoneroSendConfig)) config = new MoneroSendConfig(config);
    assert(config.getDestinations() && config.getDestinations().length === 1, "Must specify exactly one destination address to sweep to");
    assert(config.getDestinations()[0].getAddress());
    assert.equal(config.getDestinations()[0].getAmount(), undefined);
    assert.equal(config.getKeyImage(), undefined, "Key image defined; use sweepOutput() to sweep an output by its key image");
    
    // determine accounts to sweep from; default to all with unlocked balance if not specified
    let accountIndices = [];
    if (config.getAccountIndex() !== undefined) accountIndices.push(config.getAccountIndex());
    else {
      for (let account of await this.getAccounts()) {
        if (account.getUnlockedBalance().compare(new BigInteger(0)) > 0) {
          accountIndices.push(account.getIndex());
        }
      }
    }
    
    // common request params
    let params = {};
    params.address = config.getDestinations()[0].getAddress();
    params.priority = config.getPriority();
    params.mixin = config.getMixin();
    params.unlock_time = config.getUnlockTime();
    params.payment_id = config.getPaymentId();
    params.do_not_relay = config.getDoNotRelay();
    params.below_amount = config.getBelowAmount();
    params.get_tx_keys = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
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
        for (let subaddress of await this.getSubaddresses(accountIdx, undefined, true)) {
          if (subaddress.getUnlockedBalance().compare(new BigInteger(0)) > 0) {
            subaddressIndices.push(subaddress.getIndex());
          }
        }
      }
      if (subaddressIndices.length === 0) throw new MoneroError("No subaddresses to sweep from");
      
      // sweep each subaddress individually
      if (config.getSweepEachSubaddress() === undefined || config.getSweepEachSubaddress()) {
        for (let subaddressIdx of subaddressIndices) {
          params.subaddr_indices = [subaddressIdx];
          let resp = await this.config.rpc.sendJsonRequest("sweep_all", params);
          
          // initialize tx per subaddress
          let respTxs = [];
          for (let i = 0; i < resp.result.tx_hash_list.length; i++) {
            let tx = new MoneroTxWallet();
            respTxs.push(tx);
          }
          
          // initialize fields from response
          MoneroWalletRpc._convertRpcSentTxWallets(resp.result, respTxs);
          for (let tx of respTxs) accountTxs.push(tx);
        }
      }
      
      // sweep all subaddresses together  // TODO monero-wallet-rpc: doesn't this reveal outputs belong to same wallet?
      else {
        params.subaddr_indices = [subaddressIndices];
        let resp = await this.config.rpc.sendJsonRequest("sweep_all", params);  // TODO: test this
        
        // initialize tx per subaddress
        let respTxs = [];
        for (let i = 0; i < resp.result.tx_hash_list.length; i++) {
          let tx = new MoneroTxWallet();
          respTxs.push(tx);
        }
        
        // initialize fields from response
        MoneroWalletRpc._convertRpcSentTxWallets(resp.result, respTxs);
        for (let tx of respTxs) accountTxs.push(tx);
      }
      
      // initialize known fields of tx and merge transactions from account
      for (let tx of accountTxs) {
        tx.setIsConfirmed(false);
        tx.setNumConfirmations(0);
        tx.setInTxPool(config.getDoNotRelay() ? false : true);
        tx.setDoNotRelay(config.getDoNotRelay() ? true : false);
        tx.setIsRelayed(!tx.getDoNotRelay());
        tx.setIsCoinbase(false);
        tx.setIsFailed(false);
        tx.setMixin(config.getMixin());
        let transfer = tx.getOutgoingTransfer();
        transfer.setAddress(await this.getAddress(accountIdx, 0));
        transfer.setAccountIndex(accountIdx);
        transfer.setSubaddressIndex(0); // TODO (monero-wallet-rpc): outgoing subaddress idx is always 0
        let destination = new MoneroDestination(config.getDestinations()[0].getAddress(), new BigInteger(transfer.getAmount()));
        transfer.setDestinations([destination]);
        tx.setOutgoingTransfer(transfer);
        tx.setPaymentId(config.getPaymentId());
        if (tx.getUnlockTime() === undefined) tx.setUnlockTime(config.getUnlockTime() === undefined ? 0 : config.getUnlockTime());
        if (!tx.getDoNotRelay()) {
          if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime());  // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
          if (tx.getIsDoubleSpend() === undefined) tx.setIsDoubleSpend(false);
        }
        MoneroWalletRpc._mergeTx(txs, tx);
      }
    }
    
    // return transactions from all accounts
    return txs;
  }
  
  async sweepDust(doNotRelay) {
    throw new MoneroError("Not implemented");
  }
  
  async sweepOutput(configOrAddress, keyImage, priority, mixin) {
    
    // normalize and validate config
    let config;
    if (configOrAddress instanceof MoneroSendConfig) {
      assert.equal(arguments.length, 1, "sweepOutput() requires a send configuration or parameters but both");
      config = configOrAddress;
    } else {
      if (configOrAddress instanceof Object) config = new MoneroSendConfig(configOrAddress);
      else {
        config = new MoneroSendConfig(configOrAddress, undefined, priority, mixin);
        config.setKeyImage(keyImage);
      }
    }
    assert.equal(config.getSweepEachSubaddress(), undefined);
    assert.equal(config.getBelowAmount(), undefined);
    assert.equal(config.getCanSplit(), undefined, "Splitting is not applicable when sweeping output");
    
    // build request parameters
    let params = {};
    params.address = config.getDestinations()[0].getAddress();
    params.account_index = config.getAccountIndex();
    params.subaddr_indices = config.getSubaddressIndices();
    params.key_image = config.getKeyImage();
    params.mixin = config.getMixin();
    params.unlock_time = config.getUnlockTime();
    params.do_not_relay = config.getDoNotRelay();
    params.priority = config.getPriority();
    params.payment_id = config.getPaymentId();
    params.get_tx_key = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest("sweep_single", params);

    // build and return tx response
    let tx = MoneroWalletRpc._initSentTxWallet(config);
    MoneroWalletRpc._convertRpcTxWallet(resp.result, tx, true);
    tx.getOutgoingTransfer().getDestinations()[0].setAmount(new BigInteger(tx.getOutgoingTransfer().getAmount()));  // initialize destination amount
    return tx;
  }
  
  async relayTxs(txMetadatas) {
    assert(Array.isArray(txMetadatas), "Must provide an array of tx metadata to relay");
    let txIds = [];
    for (let txMetadata of txMetadatas) {
      let resp = await this.config.rpc.sendJsonRequest("relay_tx", { hex: txMetadata });
      txIds.push(resp.result.tx_hash);
    }
    return txIds;
  }
  
  async getTxNote(txId) {
    return (await this.getTxNotes([txId]))[0];
  }

  async setTxNote(txId, note) {
    await this.setTxNotes([txId], [note]);
  }
  
  async getTxNotes(txIds) {
    return (await this.config.rpc.sendJsonRequest("get_tx_notes", {txids: txIds})).result.notes;
  }
  
  async setTxNotes(txIds, notes) {
    await this.config.rpc.sendJsonRequest("set_tx_notes", {txids: txIds, notes: notes});
  }
  
  async sign(msg) {
    let resp = await this.config.rpc.sendJsonRequest("sign", {data: msg});
    return resp.result.signature;
  }
  
  async verify(msg, address, signature) {
    let resp = await this.config.rpc.sendJsonRequest("verify", {data: msg, address: address, signature: signature});
    return resp.result.good;
  }
  
  async getTxKey(txId) {
    return (await this.config.rpc.sendJsonRequest("get_tx_key", {txid: txId})).result.tx_key;
  }
  
  async checkTxKey(txId, txKey, address) {
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest("check_tx_key", {txid: txId, tx_key: txKey, address: address});
    
    // interpret result
    let check = new MoneroCheckTx();
    check.setIsGood(true);
    check.setNumConfirmations(resp.result.confirmations);
    check.setInTxPool(resp.result.in_pool);
    check.setReceivedAmount(new BigInteger(resp.result.received));
    return check;
  }
  
  async getTxProof(txId, address, message) {
    let resp = await this.config.rpc.sendJsonRequest("get_tx_proof", {txid: txId, address: address, message: message});
    return resp.result.signature;
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
    let isGood = resp.result.good;
    let check = new MoneroCheckTx();
    check.setIsGood(isGood);
    if (isGood) {
      check.setNumConfirmations(resp.result.confirmations);
      check.setInTxPool(resp.result.in_pool);
      check.setReceivedAmount(new BigInteger(resp.result.received));
    }
    return check;
  }
  
  async getSpendProof(txId, message) {
    let resp = await this.config.rpc.sendJsonRequest("get_spend_proof", {txid: txId, message: message});
    return resp.result.signature;
  }
  
  async checkSpendProof(txId, message, signature) {
    let resp = await this.config.rpc.sendJsonRequest("check_spend_proof", {
      txid: txId,
      message: message,
      signature: signature
    });
    return resp.result.good;
  }
  
  async getReserveProofWallet(message) {
    let resp = await this.config.rpc.sendJsonRequest("get_reserve_proof", {
      all: true,
      message: message
    });
    return resp.result.signature;
  }
  
  async getReserveProofAccount(accountIdx, amount, message) {
    let resp = await this.config.rpc.sendJsonRequest("get_reserve_proof", {
      account_index: accountIdx,
      amount: amount.toString(),
      message: message
    });
    return resp.result.signature;
  }

  async checkReserveProof(address, message, signature) {
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest("check_reserve_proof", {
      address: address,
      message: message,
      signature: signature
    });
    
    // interpret results
    let isGood = resp.result.good;
    let check = new MoneroCheckReserve();
    check.setIsGood(isGood);
    if (isGood) {
      check.setSpentAmount(new BigInteger(resp.result.spent));
      check.setTotalAmount(new BigInteger(resp.result.total));
    }
    return check;
  }
  
  async getAddressBookEntries(entryIndices) {
    let resp = await this.config.rpc.sendJsonRequest("get_address_book", {entries: entryIndices});
    if (!resp.result.entries) return [];
    let entries = [];
    for (let rpcEntry of resp.result.entries) {
      entries.push(new MoneroAddressBookEntry(rpcEntry.index, rpcEntry.address, rpcEntry.payment_id, rpcEntry.description));
    }
    return entries;
  }
  
  async addAddressBookEntry(address, description, paymentId) {
    let resp = await this.config.rpc.sendJsonRequest("add_address_book", {address: address, description: description, payment_id: paymentId});
    return resp.result.index;
  }
  
  async deleteAddressBookEntry(entryIdx) {
    await this.config.rpc.sendJsonRequest("delete_address_book", {index: entryIdx});
  }
  
  async tagAccounts(tag, accountIndices) {
    await this.config.rpc.sendJsonRequest("tag_accounts", {tag: tag, accounts: accountIndices});
  }

  async untagAccounts(accountIndices) {
    await this.config.rpc.sendJsonRequest("untag_accounts", {accounts: accountIndices});
  }

  async getAccountTags() {
    let tags = [];
    let resp = await this.config.rpc.sendJsonRequest("get_account_tags");
    if (resp.result.account_tags) {
      for (let rpcAccountTag of resp.result.account_tags) {
        tags.push(new MoneroAccountTag(rpcAccountTag.tag ? rpcAccountTag.tag : undefined, rpcAccountTag.label ? rpcAccountTag.label : undefined, rpcAccountTag.accounts));
      }
    }
    return tags;
  }

  async setAccountTagLabel(tag, label) {
    await this.config.rpc.sendJsonRequest("set_account_tag_description", {tag: tag, description: label});
  }
  
  async createPaymentUri(sendConfig) {
    assert(sendConfig, "Must provide send configuration to create a payment URI");
    let resp = await this.config.rpc.sendJsonRequest("make_uri", {
      address: sendConfig.getDestinations()[0].getAddress(),
      amount: sendConfig.getDestinations()[0].getAmount() ? sendConfig.getDestinations()[0].getAmount().toString() : undefined,
      payment_id: sendConfig.getPaymentId(),
      recipient_name: sendConfig.getRecipientName(),
      tx_description: sendConfig.getNote()
    });
    return resp.result.uri;
  }
  
  async parsePaymentUri(uri) {
    assert(uri, "Must provide URI to parse");
    let resp = await this.config.rpc.sendJsonRequest("parse_uri", {uri: uri});
    let sendConfig = new MoneroSendConfig(resp.result.uri.address, new BigInteger(resp.result.uri.amount));
    sendConfig.setPaymentId(resp.result.uri.payment_id);
    sendConfig.setRecipientName(resp.result.uri.recipient_name);
    sendConfig.setNote(resp.result.uri.tx_description);
    if ("" === sendConfig.getDestinations()[0].getAddress()) sendConfig.getDestinations()[0].setAddress(undefined);
    if ("" === sendConfig.getPaymentId()) sendConfig.setPaymentId(undefined);
    if ("" === sendConfig.getRecipientName()) sendConfig.setRecipientName(undefined);
    if ("" === sendConfig.getNote()) sendConfig.setNote(undefined);
    return sendConfig;
  }
  
  async getOutputsHex() {
    return (await this.config.rpc.sendJsonRequest("export_outputs")).result.outputs_data_hex;
  }
  
  async importOutputsHex(outputsHex) {
    let resp = await this.config.rpc.sendJsonRequest("import_outputs", {outputs_data_hex: outputsHex});
    return resp.result.num_imported;
  }
  
  async setAttribute(key, val) {
    await this.config.rpc.sendJsonRequest("set_attribute", {key: key, value: val});
  }
  
  async getAttribute(key) {
    let resp = await this.config.rpc.sendJsonRequest("get_attribute", {key: key});
    return resp.result.value;
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
  
  // --------------------------------  PRIVATE --------------------------------
  
  async _getBalances(accountIdx, subaddressIdx) {
    if (accountIdx === undefined) {
      assert.equal(subaddressIdx, undefined, "Must provide account index with subaddress index");
      let balance = new BigInteger(0);
      let unlockedBalance = new BigInteger(0);
      for (let account of await this.getAccounts()) {
        balance = balance.add(account.getBalance());
        unlockedBalance = unlockedBalance.add(account.getUnlockedBalance());
      }
      return [balance, unlockedBalance];
    } else {
      let params = {account_index: accountIdx, address_indices: subaddressIdx === undefined ? undefined : [subaddressIdx]};
      let resp = await this.config.rpc.sendJsonRequest("get_balance", params);
      if (subaddressIdx === undefined) return [new BigInteger(resp.result.balance), new BigInteger(resp.result.unlocked_balance)];
      else return [new BigInteger(resp.result.per_subaddress[0].balance), new BigInteger(resp.result.per_subaddress[0].unlocked_balance)];
    }
  }
  
  async _getAccountIndices(getSubaddressIndices) {
    let indices = new Map();
    for (let account of await this.getAccounts()) {
      indices.set(account.getIndex(), getSubaddressIndices ? await this._getSubaddressIndices(account.getIndex()) : undefined);
    }
    return indices;
  }
  
  async _getSubaddressIndices(accountIdx) {
    let subaddressIndices = [];
    let resp = await this.config.rpc.sendJsonRequest("get_address", {account_index: accountIdx});
    for (let address of resp.result.addresses) subaddressIndices.push(address.address_index);
    return subaddressIndices;
  }
  
  async _send(split, configOrAddress, amount, priority, mixin) {
    
    // normalize and validate config
    let config;
    if (configOrAddress instanceof MoneroSendConfig) {
      assert.equal(arguments.length, 2, "Sending requires a send configuration or parameters but not both");
      config = configOrAddress;
    } else {
      if (configOrAddress instanceof Object) config = new MoneroSendConfig(configOrAddress);
      else {
        config = new MoneroSendConfig(configOrAddress, amount, priority, mixin);
      }
    }
    assert.equal(config.getSweepEachSubaddress(), undefined);
    assert.equal(config.getBelowAmount(), undefined);
    if (config.getCanSplit() !== undefined) assert.equal(config.getCanSplit(), split);
    
    // determine account and subaddresses to send from
    let accountIdx = config.getAccountIndex();
    if (accountIdx === undefined) accountIdx = 0; // default to account 0
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
    params.priority = config.getPriority();
    params.get_tx_key = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // send request
    let resp;
    if (split) resp = await this.config.rpc.sendJsonRequest("transfer_split", params);
    else resp = await this.config.rpc.sendJsonRequest("transfer", params);
    
    // initialize tx list
    let txs = [];
    if (split) for (let i = 0; i < resp.result.tx_hash_list.length; i++) txs.push(new MoneroTxWallet());
    else txs.push(new MoneroTxWallet());
    
    // initialize known fields of tx
    for (let tx of txs) {
      MoneroWalletRpc._initSentTxWallet(config, tx);
      tx.getOutgoingTransfer().setAccountIndex(accountIdx);
    }
    
    // initialize txs from rpc response
    if (split) MoneroWalletRpc._convertRpcSentTxWallets(resp.result, txs);
    else MoneroWalletRpc._convertRpcTxWallet(resp.result, txs[0], true);
    
    // return array or element depending on split
    return split ? txs : txs[0];
  }
  
  /**
   * Common method to get key images.
   * 
   * @param all specifies to get all xor only new images from last import
   * @return {MoneroKeyImage[]} are the key images
   */
  async _getKeyImages(all) {
    let resp = await this.config.rpc.sendJsonRequest("export_key_images", {all: all});
    if (!resp.result.signed_key_images) return [];
    return resp.result.signed_key_images.map(rpcImage => new MoneroKeyImage(rpcImage.key_image, rpcImage.signature));
  }
  
  // ---------------------------- PRIVATE STATIC ------------------------------
  
  static _convertRpcAccount(rpcAccount) {
    let account = new MoneroAccount();
    for (let key of Object.keys(rpcAccount)) {
      let val = rpcAccount[key];
      if (key === "account_index") account.setIndex(val);
      else if (key === "balance") account.setBalance(new BigInteger(val));
      else if (key === "unlocked_balance") account.setUnlockedBalance(new BigInteger(val));
      else if (key === "base_address") account.setPrimaryAddress(val);
      else if (key === "label") { if (val) account.setLabel(val); }
      //else if (key === "tag") account.setTag(val);  TODO support account tagss
      else if (key === "tag") { }
      else console.log("WARNING: ignoring unexpected account field: " + key + ": " + val);
    }
    return account;
  }
  
  static _convertRpcSubaddress(rpcSubaddress) {
    let subaddress = new MoneroSubaddress();
    for (let key of Object.keys(rpcSubaddress)) {
      let val = rpcSubaddress[key];
      if (key === "account_index") subaddress.setAccountIndex(val);
      else if (key === "address_index") subaddress.setIndex(val);
      else if (key === "address") subaddress.setAddress(val);
      else if (key === "balance") subaddress.setBalance(new BigInteger(val));
      else if (key === "unlocked_balance") subaddress.setUnlockedBalance(new BigInteger(val));
      else if (key === "num_unspent_outputs") subaddress.setNumUnspentOutputs(val);
      else if (key === "label") { if (val) subaddress.setLabel(val); }
      else if (key === "used") subaddress.setIsUsed(val);
      else console.log("WARNING: ignoring unexpected subaddress field: " + key + ": " + val);
    }
    return subaddress;
  }
  
  /**
   * Builds a MoneroTxWallet from a RPC tx.
   * 
   * @param rpcTx is the rpc tx to build from
   * @param tx is an existing tx to continue initializing (optional)
   * @param isOutgoing specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
   * @returns {MoneroTxWallet} is the initialized tx
   */
  static _convertRpcTxWallet(rpcTx, tx, isOutgoing) {  // TODO: change everything to safe set
        
    // initialize tx to return
    if (!tx) tx = new MoneroTxWallet();
    
    // initialize tx state from rpc type
    if (rpcTx.type !== undefined) isOutgoing = MoneroWalletRpc._decodeRpcType(rpcTx.type, tx);
    else {
      assert.equal(typeof isOutgoing, "boolean", "Must indicate if tx is outgoing (true) xor incoming (false) since unknown");
      assert.equal(typeof tx.getIsConfirmed(), "boolean");
      assert.equal(typeof tx.getInTxPool(), "boolean");
      assert.equal(typeof tx.getIsCoinbase(), "boolean");
      assert.equal(typeof tx.getIsFailed(), "boolean");
      assert.equal(typeof tx.getDoNotRelay(), "boolean");
    }
    
    // TODO: safe set
    // initialize remaining fields  TODO: seems this should be part of common function with DaemonRpc._convertRpcTx
    let header;
    let transfer;
    let accountIdx;
    let subaddressIdx;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "txid") tx.setId(val);
      else if (key === "tx_hash") tx.setId(val);
      else if (key === "fee") tx.setFee(new BigInteger(val));
      else if (key === "note") { if (val) tx.setNote(val); }
      else if (key === "tx_key") tx.setKey(val);
      else if (key === "type") { } // type already handled
      else if (key === "tx_size") tx.setSize(val);
      else if (key === "unlock_time") tx.setUnlockTime(val);
      else if (key === "tx_blob") tx.setFullHex(val);
      else if (key === "tx_metadata") tx.setMetadata(val);
      else if (key === "double_spend_seen") tx.setIsDoubleSpend(val);
      else if (key === "block_height" || key === "height") {
        if (tx.getIsConfirmed()) {
          if (!header) header = new MoneroBlockHeader();
          header.setHeight(val);
        }
      }
      else if (key === "timestamp") {
        if (tx.getIsConfirmed()) {
          if (!header) header = new MoneroBlockHeader();
          header.setTimestamp(val);
        } else {
          tx.setReceivedTimestamp(val);
        }
      }
      else if (key === "confirmations") {
        if (!tx.getIsConfirmed()) tx.setNumConfirmations(0);
        else tx.setNumConfirmations(val);
      }
      else if (key === "suggested_confirmations_threshold") {
        if (tx.getInTxPool()) tx.setNumEstimatedBlocksUntilConfirmed(val);
        else tx.setNumEstimatedBlocksUntilConfirmed(undefined);
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
        assert(isOutgoing);
        let destinations = [];
        for (let rpcDestination of val) {
          let destination = new MoneroDestination();
          destinations.push(destination);
          for (let destinationKey of Object.keys(rpcDestination)) {
            if (destinationKey === "address") destination.setAddress(rpcDestination[destinationKey]);
            else if (destinationKey === "amount") destination.setAmount(new BigInteger(rpcDestination[destinationKey]));
            else throw new MoneroError("Unrecognized transaction destination field: " + destinationKey);
          }
        }
        if (transfer === undefined) transfer = new MoneroTransfer({tx: tx});
        transfer.setDestinations(destinations);
      }
      else if (key === "multisig_txset" && !val) {} // TODO: handle this with value
      else if (key === "unsigned_txset" && !val) {} // TODO: handle this with value
      else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }
    
    // link block and tx
    if (header) tx.setBlock(new MoneroBlock(header).setTxs([tx]));
    
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
  
  static _convertRpcTxWalletVout(rpcVout) {
    
    // initialize tx
    let tx = new MoneroTxWallet();
    tx.setIsConfirmed(true);
    tx.setIsRelayed(true);
    tx.setIsFailed(false);
    
    // initialize vout
    let vout = new MoneroOutputWallet({tx: tx});
    for (let key of Object.keys(rpcVout)) {
      let val = rpcVout[key];
      if (key === "amount") vout.setAmount(new BigInteger(val));
      else if (key === "spent") vout.setIsSpent(val);
      else if (key === "key_image") vout.setKeyImage(new MoneroKeyImage(val));
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
   * Initializes a sent transaction.
   * 
   * @param {MoneroSendConfig} config is the send configuration
   * @param {MoneroTxWallet} is an existing transaction to initialize (optional)
   * @return {MoneroTxWallet} is the initialized send tx
   */
  static _initSentTxWallet(config, tx) {
    if (!tx) tx = new MoneroTxWallet();
    tx.setIsConfirmed(false);
    tx.setNumConfirmations(0);
    tx.setInTxPool(config.getDoNotRelay() ? false : true);
    tx.setDoNotRelay(config.getDoNotRelay() ? true : false);
    tx.setIsRelayed(!tx.getDoNotRelay());
    tx.setIsCoinbase(false);
    tx.setIsFailed(false);
    tx.setMixin(config.getMixin());
    let transfer = new MoneroTransfer({tx: tx});
    transfer.setSubaddressIndex(0); // TODO (monero-wallet-rpc): outgoing subaddress idx is always 0
    transfer.setDestinations(config.getDestinations());
    tx.setOutgoingTransfer(transfer);
    tx.setPaymentId(config.getPaymentId());
    if (tx.getUnlockTime() === undefined) tx.setUnlockTime(config.getUnlockTime() === undefined ? 0 : config.getUnlockTime());
    if (!tx.getDoNotRelay()) {
      if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime());  // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
      if (tx.getIsDoubleSpend() === undefined) tx.setIsDoubleSpend(false);
    }
    return tx;
  }
  
  /**
   * Initializes sent MoneroTxWallet[] from a list of rpc txs.
   * 
   * @param rpcTxs are sent rpc txs to initialize the MoneroTxWallets from
   * @param txs are existing txs to initialize (optional)
   */
  static _convertRpcSentTxWallets(rpcTxs, txs) {
    
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
    assert.equal(sizes.size, 1, "RPC lists are different sizes");
    
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
      tx.setFullHex(blobs[i]);
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
      throw new MoneroError("Unrecognized transfer type: " + rpcType);
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
      
      // merge tx
      if (aTx.getId() === tx.getId()) {
        aTx.merge(tx);
        return aTx;
      }
      
      // merge block
      if (tx.getHeight() !== undefined && aTx.getHeight() === tx.getHeight()) {
        aTx.getBlock().merge(tx.getBlock())
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
}

module.exports = MoneroWalletRpc;