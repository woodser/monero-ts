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
const MoneroIncomingTransfer = require("./model/MoneroIncomingTransfer");
const MoneroOutgoingTransfer = require("./model/MoneroOutgoingTransfer");
const MoneroDestination = require("./model/MoneroDestination");
const MoneroOutputWallet = require("./model/MoneroOutputWallet");
const MoneroSendRequest = require("./request/MoneroSendRequest");
const MoneroCheckTx = require("./model/MoneroCheckTx");
const MoneroCheckReserve = require("./model/MoneroCheckReserve");
const MoneroTxRequest = require("./request/MoneroTxRequest");
const MoneroTransferRequest = require("./request/MoneroTransferRequest");
const MoneroOutputRequest = require("./request/MoneroOutputRequest");
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
  
  getRpc() {
    return this.config.rpc;
  }

  /**
   * Rescan the blockchain for spent outputs.
   */
  async rescanSpent() {
    await this.config.rpc.sendJsonRequest("rescan_spent");
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
  
  async rescanBlockchain() {
    await this.config.rpc.sendJsonRequest("rescan_blockchain");
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
      
      // these fields are not initialized if subaddress is unused and therefore not returned from `get_balance`
      for (let account of accounts) {
        for (let subaddress of account.getSubaddresses()) {
          subaddress.setBalance(new BigInteger(0));
          subaddress.setUnlockedBalance(new BigInteger(0));
          subaddress.setNumUnspentOutputs(0);
          subaddress.setNumBlocksToUnlock(0);
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
      
      // these fields are not initialized if subaddress is unused and therefore not returned from `get_balance`
      for (let subaddress of subaddresses) {
        subaddress.setBalance(new BigInteger(0));
        subaddress.setUnlockedBalance(new BigInteger(0));
        subaddress.setNumUnspentOutputs(0);
        subaddress.setNumBlocksToUnlock(0);
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
            if (subaddress.getNumBlocksToUnlock() !== undefined) tgtSubaddress.setNumBlocksToUnlock(subaddress.getNumBlocksToUnlock());
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
    subaddress.setNumBlocksToUnlock(0);
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
    
    // fetch result and normalize error if address does not belong to the wallet
    let resp;
    try {
      resp = await this.config.rpc.sendJsonRequest("get_address_index", {address: address});
    } catch (e) {
      if (e.getCode() === -2) throw new MoneroError("Address does not belong to the wallet");
      throw e;
    }
    
    // convert rpc response
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
  
  async getTxs(request) {
    
    // normalize tx request
    if (request instanceof MoneroTxRequest) { }
    else if (Array.isArray(request)) request = new MoneroTxRequest().setTxIds(request);
    else {
      request = Object.assign({}, request);
      if (!request.id) request.id = request.txId;  // support txId TODO: move into MoneroTxRequest?
      request = new MoneroTxRequest(request);
    }
    if (!request.getTransferRequest()) request.setTransferRequest(new MoneroTransferRequest());
    let transferRequest = request.getTransferRequest();
    
    // temporarily disable transfer request
    request.setTransferRequest(undefined);
    
    // fetch all transfers that meet tx request
    let transfers = await this.getTransfers(new MoneroTransferRequest().setTxRequest(request));  // TODO: {request: request} instead, need to resolve circular request imports, also pass debugTxId here
    
    // collect unique txs from transfers while retaining order
    let txs = [];
    let txsSet = new Set();
    for (let transfer of transfers) {
      if (!txsSet.has(transfer.getTx())) {
        txs.push(transfer.getTx());
        txsSet.add(transfer.getTx());
      }
    }
    
    // fetch and merge outputs if requested
    if (request.getIncludeOutputs()) {
      let outputs = await this.getOutputs(new MoneroOutputRequest().setTxRequest(request));
      
      // merge output txs one time while retaining order
      let outputTxs = [];
      for (let output of outputs) {
        if (!outputTxs.includes(output.getTx())){
          MoneroWalletRpc._mergeTx(txs, output.getTx(), true);
          outputTxs.push(output.getTx());
        }
      }
    }
    
    // filter txs that don't meet transfer request
    request.setTransferRequest(transferRequest);
    txs = Filter.apply(request, txs);
    
    // verify all specified tx ids found
    if (request.getTxIds()) {
      for (let txId of request.getTxIds()) {
        let found = false;
        for (let tx of txs) {
          if (txId === tx.getId()) {
            found = true;
            break;
          }
        }
        if (!found) throw new MoneroError("Tx not found in wallet: " + txId);
      }
    }
    
    // special case: re-fetch txs if inconsistency caused by needing to make multiple rpc calls
    for (let tx of txs) {
      if (tx.getIsConfirmed() && tx.getBlock() === undefined) return this.getTxs(request);
    }
    
    // otherwise order txs if tx ids given then return
    if (request.getTxIds()) {
      let txsById = {}  // store txs in temporary map for sorting
      for (let tx of txs) txsById[tx.getId()] = tx;
      let orderedTxs = [];
      for (let txId of request.getTxIds()) if (txsById[txId]) orderedTxs.push(txsById[txId]);
      txs = orderedTxs;
    }
    return txs;
  }
  
  async getTransfers(request) {
    
    // normalize transfer request
    if (request instanceof MoneroTransferRequest) { }
    else {
      request = Object.assign({}, request);
      if (!request.id) request.id = request.txId;  // support txId TODO: move into MoneroTxRequest?
      request = new MoneroTransferRequest(request).setTxRequest(new MoneroTxRequest(request));
    }
    if (!request.getTxRequest()) request.setTxRequest(new MoneroTxRequest());
    let txRequest = request.getTxRequest();
    
    // build params for get_transfers rpc call
    let params = {};
    let canBeConfirmed = txRequest.getIsConfirmed() !== false && txRequest.getInTxPool() !== true && txRequest.getIsFailed() !== true && txRequest.getIsRelayed() !== false;
    let canBeInTxPool = txRequest.getIsConfirmed() !== true && txRequest.getInTxPool() !== false && txRequest.getIsFailed() !== true && txRequest.getIsRelayed() !== false && txRequest.getHeight() === undefined && txRequest.getMinHeight() === undefined;
    let canBeIncoming = request.getIsIncoming() !== false && request.getIsOutgoing() !== true && request.getHasDestinations() !== true;
    let canBeOutgoing = request.getIsOutgoing() !== false && request.getIsIncoming() !== true;
    params.in = canBeIncoming && canBeConfirmed;
    params.out = canBeOutgoing && canBeConfirmed;
    params.pool = canBeIncoming && canBeInTxPool;
    params.pending = canBeOutgoing && canBeInTxPool;
    params.failed = txRequest.getIsFailed() !== false && txRequest.getIsConfirmed() !== true && txRequest.getInTxPool() != true;
    if (txRequest.getMinHeight() !== undefined) params.min_height = txRequest.getMinHeight(); 
    if (txRequest.getMaxHeight() !== undefined) params.max_height = txRequest.getMaxHeight();
    params.filter_by_height = txRequest.getMinHeight() !== undefined || txRequest.getMaxHeight() !== undefined;
    if (request.getAccountIndex() === undefined) {
      assert(request.getSubaddressIndex() === undefined && request.getSubaddressIndices() === undefined, "Filter specifies a subaddress index but not an account index");
      params.all_accounts = true;
    } else {
      params.account_index = request.getAccountIndex();
      
      // set subaddress indices param
      let subaddressIndices = new Set();
      if (request.getSubaddressIndex() !== undefined) subaddressIndices.add(request.getSubaddressIndex());
      if (request.getSubaddressIndices() !== undefined) request.getSubaddressIndices().map(subaddressIdx => subaddressIndices.add(subaddressIdx));
      if (subaddressIndices.size) params.subaddr_indices = Array.from(subaddressIndices);
    }
    
    // build txs using `get_transfers`
    let txs = [];
    let resp = await this.config.rpc.sendJsonRequest("get_transfers", params);
    for (let key of Object.keys(resp.result)) {
      for (let rpcTx of resp.result[key]) {
        if (rpcTx.txid === request.debugTxId) console.log(rpcTx);
        let tx = MoneroWalletRpc._convertRpcTxWalletWithTransfer(rpcTx);
        
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
      if (request.meetsCriteria(tx.getOutgoingTransfer())) transfers.push(tx.getOutgoingTransfer());
      if (tx.getIncomingTransfers()) Filter.apply(request, tx.getIncomingTransfers()).map(transfer => transfers.push(transfer));
    }
    
    return transfers;
  }
  
  async getOutputs(request) {
    
    // normalize output request
    if (request instanceof MoneroOutputRequest) { }
    else {
      request = Object.assign({}, request);
      if (!request.id) request.id = request.txId;  // support txId TODO: move into MoneroTransaction?
      request = new MoneroOutputRequest(request).setTxRequest(new MoneroTxRequest(request));
    }
    if (!request.getTxRequest()) request.setTxRequest(new MoneroTxRequest());
    
    // determine account and subaddress indices to be queried
    let indices = new Map();
    if (request.getAccountIndex() !== undefined) {
      let subaddressIndices = new Set();
      if (request.getSubaddressIndex() !== undefined) subaddressIndices.add(request.getSubaddressIndex());
      if (request.getSubaddressIndices() !== undefined) request.getSubaddressIndices().map(subaddressIdx => subaddressIndices.add(subaddressIdx));
      indices.set(request.getAccountIndex(), subaddressIndices.size ? Array.from(subaddressIndices) : undefined);  // undefined will fetch from all subaddresses
    } else {
      assert.equal(request.getSubaddressIndex(), undefined, "Filter specifies a subaddress index but not an account index")
      assert(request.getSubaddressIndices() === undefined || request.getSubaddressIndices().length === 0, "Filter specifies subaddress indices but not an account index");
      indices = await this._getAccountIndices();  // fetch all account indices without subaddresses
    }
    
    // collect txs with vouts for each indicated account using `incoming_transfers` rpc call
    let txs = [];
    let params = {};
    params.transfer_type = request.getIsSpent() === true ? "unavailable" : request.getIsSpent() === false ? "available" : "all";
    params.verbose = true;
    for (let accountIdx of indices.keys()) {
    
      // send request
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.config.rpc.sendJsonRequest("incoming_transfers", params);
      
      // convert response to txs with vouts and merge
      if (resp.result.transfers === undefined) continue;
      for (let rpcVout of resp.result.transfers) {
        let tx = MoneroWalletRpc._convertRpcTxWalletWithVout(rpcVout);
        MoneroWalletRpc._mergeTx(txs, tx);
      }
    }
    
    // filter and return vouts
    let vouts = [];
    for (let tx of txs) {
      Filter.apply(request, tx.getVouts()).map(vout => vouts.push(vout));
    }
    return vouts;
  }
  
  async getKeyImages() {
    return await this._rpcExportKeyImages(true);
  }
  
  async importKeyImages(keyImages) {
    
    // convert key images to rpc parameter
    let rpcKeyImages = keyImages.map(keyImage => ({key_image: keyImage.getHex(), signature: keyImage.getSignature()}));
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest("import_key_images", {signed_key_images: rpcKeyImages});
    
    // build and return result
    let importResult = new MoneroKeyImageImportResult();
    importResult.setHeight(resp.result.height);
    importResult.setSpentAmount(new BigInteger(resp.result.spent));
    importResult.setUnspentAmount(new BigInteger(resp.result.unspent));
    return importResult;
  }
  
  async getNewKeyImagesFromLastImport() {
    return await this._rpcExportKeyImages(false);
  }
  
  async send(requestOrAddress, amount, priority, mixin) {
    let args = [].slice.call(arguments);
    args.splice(0, 0, false);  // specify splitting
    return await this._send.apply(this, args);
  }

  async sendSplit(requestOrAddress, amount, priority, mixin) {
    let args = [].slice.call(arguments);
    args.splice(0, 0, true);  // specify splitting
    return await this._send.apply(this, args);
  }
  
  async sweepOutput(requestOrAddress, keyImage, priority, mixin) {
    
    // normalize and validate request
    let request;
    if (requestOrAddress instanceof MoneroSendRequest) {
      assert.equal(arguments.length, 1, "sweepOutput() requires a send request or parameters but both");
      request = requestOrAddress;
    } else {
      if (requestOrAddress instanceof Object) request = new MoneroSendRequest(requestOrAddress);
      else {
        request = new MoneroSendRequest(requestOrAddress, undefined, priority, mixin);
        request.setKeyImage(keyImage);
      }
    }
    assert.equal(request.getSweepEachSubaddress(), undefined);
    assert.equal(request.getBelowAmount(), undefined);
    assert.equal(request.getCanSplit(), undefined, "Splitting is not applicable when sweeping output");
    
    // build request parameters
    let params = {};
    params.address = request.getDestinations()[0].getAddress();
    params.account_index = request.getAccountIndex();
    params.subaddr_indices = request.getSubaddressIndices();
    params.key_image = request.getKeyImage();
    params.mixin = request.getMixin();
    params.ring_size = request.getRingSize();
    params.unlock_time = request.getUnlockTime();
    params.do_not_relay = request.getDoNotRelay();
    assert(request.getPriority() === undefined || request.getPriority() >= 0 && request.getPriority() <= 3);
    params.priority = request.getPriority();
    params.payment_id = request.getPaymentId();
    params.get_tx_key = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest("sweep_single", params);

    // build and return tx response
    let tx = MoneroWalletRpc._initSentTxWallet(request);
    MoneroWalletRpc._convertRpcTxWalletWithTransfer(resp.result, tx, true);
    tx.getOutgoingTransfer().getDestinations()[0].setAmount(new BigInteger(tx.getOutgoingTransfer().getAmount()));  // initialize destination amount
    return tx;
  }
  
  async sweepAllUnlocked(request) {
    
    // validate request
    if (request === undefined) throw new MoneroError("Must specify sweep request");
    if (request.getDestinations() === undefined || request.getDestinations().length != 1) throw new MoneroError("Must specify exactly one destination to sweep to");
    if (request.getDestinations()[0].getAddress() === undefined) throw new MoneroError("Must specify destination address to sweep to");
    if (request.getDestinations()[0].getAmount() !== undefined) throw new MoneroError("Cannot specify amount in sweep request");
    if (request.getKeyImage() !== undefined) throw new MoneroError("Key image defined; use sweepOutput() to sweep an output by its key image");
    if (request.getSubaddressIndices() !== undefined && request.getSubaddressIndices().length === 0) request.setSubaddressIndices(undefined);
    if (request.getAccountIndex() === undefined && request.getSubaddressIndices() !== undefined) throw new MoneroError("Must specify account index with subaddress indicies");
    
    // determine account and subaddress indices to sweep; default to all with unlocked balance if not specified
    let indices = new Map();  // maps each account index to subaddress indices to sweep
    if (request.getAccountIndex() !== undefined) {
      if (request.getSubaddressIndices() !== undefined) {
        indices.set(request.getAccountIndex(), request.getSubaddressIndices());
      } else {
        let subaddressIndices = [];
        indices.set(request.getAccountIndex(), subaddressIndices);
        for (let subaddress of await this.getSubaddresses(request.getAccountIndex())) {
          if (subaddress.getUnlockedBalance().compare(new BigInteger(0)) > 0) subaddressIndices.push(subaddress.getIndex());
        }
      }
    } else {
      let accounts = await this.getAccounts(true);
      for (let account of accounts) {
        if (account.getUnlockedBalance().compare(new BigInteger(0)) > 0) {
          let subaddressIndices = [];
          indices.set(account.getIndex(), subaddressIndices);
          for (let subaddress of account.getSubaddresses()) {
            if (subaddress.getUnlockedBalance().compare(new BigInteger(0)) > 0) subaddressIndices.push(subaddress.getIndex());
          }
        }
      }
    }
    
    // sweep from each account and collect unique transactions
    let txs = [];
    for (let accountIdx of indices.keys()) {
      request.setAccountIndex(accountIdx);  // TODO: this modifies original request param; deep copy with new MoneroSendRequest(request)
      
      // sweep all subaddresses together  // TODO monero-wallet-rpc: doesn't this reveal outputs belong to same wallet?
      if (request.getSweepEachSubaddress() !== true) {
        request.setSubaddressIndices(indices.get(accountIdx));
        try {
          for (let tx of await this._rpcSweepAll(request)) txs.push(tx);
        } catch (e) {
          // account cannot be swept  // TODO: confirm error code and message indicate not enough unlocked balance to cover fee
        }
      }
      
      // sweep each subaddress individually
      else {
        for (let subaddressIdx of indices.get(accountIdx)) {
          request.setSubaddressIndices([subaddressIdx]);
          try {
            for (let tx of await this._rpcSweepAll(request)) txs.push(tx);
          } catch (e) {
            // subaddress cannot be swept
          }
        }
      }
    }
    
    // return sweep transactions
    return txs;
  }
  
  async sweepDust(doNotRelay) {
    let resp = await this.config.rpc.sendJsonRequest("sweep_dust", {do_not_relay: doNotRelay});
    if (!resp.result.tx_hash_list) return [];
    let txs = MoneroWalletRpc._convertRpcSentTxWallets(result, undefined);
    for (let tx of txs) {
      tx.setIsRelayed(!doNotRelay);
      tx.setInTxPool(tx.getIsRelayed());
    }
    return txs;
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
  
  async createPaymentUri(request) {
    assert(request, "Must provide send request to create a payment URI");
    let resp = await this.config.rpc.sendJsonRequest("make_uri", {
      address: request.getDestinations()[0].getAddress(),
      amount: request.getDestinations()[0].getAmount() ? request.getDestinations()[0].getAmount().toString() : undefined,
      payment_id: request.getPaymentId(),
      recipient_name: request.getRecipientName(),
      tx_description: request.getNote()
    });
    return resp.result.uri;
  }
  
  async parsePaymentUri(uri) {
    assert(uri, "Must provide URI to parse");
    let resp = await this.config.rpc.sendJsonRequest("parse_uri", {uri: uri});
    let request = new MoneroSendRequest(resp.result.uri.address, new BigInteger(resp.result.uri.amount));
    request.setPaymentId(resp.result.uri.payment_id);
    request.setRecipientName(resp.result.uri.recipient_name);
    request.setNote(resp.result.uri.tx_description);
    if ("" === request.getDestinations()[0].getAddress()) request.getDestinations()[0].setAddress(undefined);
    if ("" === request.getPaymentId()) request.setPaymentId(undefined);
    if ("" === request.getRecipientName()) request.setRecipientName(undefined);
    if ("" === request.getNote()) request.setNote(undefined);
    return request;
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
  
  async _send(split, requestOrAddress, amount, priority, mixin) {
    
    // normalize and validate request
    let request;
    if (requestOrAddress instanceof MoneroSendRequest) {
      assert.equal(arguments.length, 2, "Sending requires a send request or parameters but not both");
      request = requestOrAddress;
    } else {
      if (requestOrAddress instanceof Object) request = new MoneroSendRequest(requestOrAddress);
      else {
        request = new MoneroSendRequest(requestOrAddress, amount, priority, mixin);
      }
    }
    assert.equal(request.getSweepEachSubaddress(), undefined);
    assert.equal(request.getBelowAmount(), undefined);
    if (request.getCanSplit() !== undefined) assert.equal(request.getCanSplit(), split);
    
    // determine account and subaddresses to send from
    let accountIdx = request.getAccountIndex();
    if (accountIdx === undefined) accountIdx = 0; // default to account 0
    let subaddressIndices = request.getSubaddressIndices() === undefined ? await this._getSubaddressIndices(accountIdx) : request.getSubaddressIndices().slice(0);  // copy given indices or fetch all
    
    // build request parameters
    let params = {};
    params.destinations = [];
    for (let destination of request.getDestinations()) {
      assert(destination.getAddress(), "Destination address is not defined");
      assert(destination.getAmount(), "Destination amount is not defined");
      params.destinations.push({ address: destination.getAddress(), amount: destination.getAmount().toString() });
    }
    params.account_index = accountIdx;
    params.subaddr_indices = subaddressIndices;
    params.payment_id = request.getPaymentId();
    params.mixin = request.getMixin();
    params.ring_size = request.getRingSize();
    params.unlock_time = request.getUnlockTime();
    params.do_not_relay = request.getDoNotRelay();
    assert(request.getPriority() === undefined || request.getPriority() >= 0 && request.getPriority() <= 3);
    params.priority = request.getPriority();
    params.get_tx_key = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // send request
    let resp = await this.config.rpc.sendJsonRequest(split ? "transfer_split" : "transfer", params);
    
    // initialize tx list
    let txs = [];
    if (split) for (let i = 0; i < resp.result.tx_hash_list.length; i++) txs.push(new MoneroTxWallet());
    else txs.push(new MoneroTxWallet());
    
    // initialize known fields of txs
    for (let tx of txs) {
      MoneroWalletRpc._initSentTxWallet(request, tx);
      tx.getOutgoingTransfer().setAccountIndex(accountIdx);
      if (subaddressIndices.length === 1) tx.getOutgoingTransfer().setSubaddressIndices(subaddressIndices);
    }
    
    // initialize txs from rpc response
    if (split) MoneroWalletRpc._convertRpcSentTxWallets(resp.result, txs);
    else MoneroWalletRpc._convertRpcTxWalletWithTransfer(resp.result, txs[0], true);
    
    // return array or element depending on split
    return split ? txs : txs[0];
  }
  
  /**
   * Common method to get key images.
   * 
   * @param all specifies to get all xor only new images from last import
   * @return {MoneroKeyImage[]} are the key images
   */
  async _rpcExportKeyImages(all) {
    let resp = await this.config.rpc.sendJsonRequest("export_key_images", {all: all});
    if (!resp.result.signed_key_images) return [];
    return resp.result.signed_key_images.map(rpcImage => new MoneroKeyImage(rpcImage.key_image, rpcImage.signature));
  }
  
  async _rpcSweepAll(request) {
    
    // validate request
    if (request === undefined) throw new MoneroError("Must specify sweep request");
    if (request.getAccountIndex() === undefined) throw new MoneroError("Must specify an account index to sweep from");
    if (request.getDestinations() === undefined || request.getDestinations().length != 1) throw new MoneroError("Must specify exactly one destination to sweep to");
    if (request.getDestinations()[0].getAddress() === undefined) throw new MoneroError("Must specify destination address to sweep to");
    if (request.getDestinations()[0].getAmount() !== undefined) throw new MoneroError("Cannot specify amount in sweep request");
    if (request.getKeyImage() !== undefined) throw new MoneroError("Key image defined; use sweepOutput() to sweep an output by its key image");
    if (request.getSubaddressIndices() !== undefined && request.getSubaddressIndices().length === 0) request.setSubaddressIndices(undefined);
    
    // sweep from all subaddresses if not otherwise defined
    if (request.getSubaddressIndices() === undefined) {
      request.setSubaddressIndices([]);
      for (let subaddress of await this.getSubaddresses(request.getAccountIndex())) {
        request.getSubaddressIndices().push(subaddress.getIndex());
      }
    }
    if (request.getSubaddressIndices().length === 0) throw new MoneroError("No subaddresses to sweep from");
    
    // common request params
    let params = {};
    params.account_index = request.getAccountIndex();
    params.subaddr_indices = request.getSubaddressIndices();
    params.address = request.getDestinations()[0].getAddress();
    assert(request.getPriority() === undefined || request.getPriority() >= 0 && request.getPriority() <= 3);
    params.priority = request.getPriority();
    params.mixin = request.getMixin();
    params.ring_size = request.getRingSize();
    params.unlock_time = request.getUnlockTime();
    params.payment_id = request.getPaymentId();
    params.do_not_relay = request.getDoNotRelay();
    params.below_amount = request.getBelowAmount();
    params.get_tx_keys = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // invoke wallet rpc `sweep_all`
    let resp = await this.config.rpc.sendJsonRequest("sweep_all", params);
    let result = resp.result;
    
    // initialize txs from response
    let txs = MoneroWalletRpc._convertRpcSentTxWallets(result, undefined);
    
    // initialize known fields of tx and merge transactions from account
    for (let tx of txs) {
      tx.setIsConfirmed(false);
      tx.setNumConfirmations(0);
      tx.setInTxPool(request.getDoNotRelay() ? false : true);
      tx.setDoNotRelay(request.getDoNotRelay() ? true : false);
      tx.setIsRelayed(!tx.getDoNotRelay());
      tx.setIsCoinbase(false);
      tx.setIsFailed(false);
      tx.setMixin(request.getMixin());
      let transfer = tx.getOutgoingTransfer();
      transfer.setAccountIndex(request.getAccountIndex());
      if (request.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(request.getSubaddressIndices()); // TODO: deep copy
      let destination = new MoneroDestination(request.getDestinations()[0].getAddress(), new BigInteger(transfer.getAmount()));
      transfer.setDestinations([destination]);
      tx.setOutgoingTransfer(transfer);
      tx.setPaymentId(request.getPaymentId());
      if (tx.getUnlockTime() === undefined) tx.setUnlockTime(request.getUnlockTime() === undefined ? 0 : request.getUnlockTime());
      if (!tx.getDoNotRelay()) {
        if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime());  // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
        if (tx.getIsDoubleSpend() === undefined) tx.setIsDoubleSpend(false);
      }
    }
    return txs;
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
      else if (key === "tag") account.setTag(val);
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
      else if (key === "blocks_to_unlock") subaddress.setNumBlocksToUnlock(val);
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
  static _convertRpcTxWalletWithTransfer(rpcTx, tx, isOutgoing) {  // TODO: change everything to safe set
        
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
          // timestamp of unconfirmed tx is current request time
        }
      }
      else if (key === "confirmations") {
        if (!tx.getIsConfirmed()) tx.setNumConfirmations(0);
        else tx.setNumConfirmations(val);
      }
      else if (key === "suggested_confirmations_threshold") {
        if (tx.getInTxPool()) tx.setNumSuggestedConfirmations(val);
        else tx.setNumSuggestedConfirmations(undefined);
      }
      else if (key === "amount") {
        if (transfer === undefined) transfer = (isOutgoing ? new MoneroOutgoingTransfer() : new MoneroIncomingTransfer()).setTx(tx);
        transfer.setAmount(new BigInteger(val));
      }
      else if (key === "address") {
        if (!isOutgoing) {
          if (!transfer) transfer = new MoneroIncomingTransfer().setTx(tx);
          transfer.setAddress(val);
        }
      }
      else if (key === "payment_id") {
        if (MoneroTxWallet.DEFAULT_PAYMENT_ID !== val) tx.setPaymentId(val);  // default is undefined
      }
      else if (key === "subaddr_index") assert(rpcTx.subaddr_indices);  // handled by subaddr_indices
      else if (key === "subaddr_indices") {
        if (!transfer) transfer = (isOutgoing ? new MoneroOutgoingTransfer() : new MoneroIncomingTransfer()).setTx(tx);
        let rpcIndices = val;
        transfer.setAccountIndex(rpcIndices[0].major);
        if (isOutgoing) {
          let subaddressIndices = [];
          for (let rpcIndex of rpcIndices) subaddressIndices.push(rpcIndex.minor);
          transfer.setSubaddressIndices(subaddressIndices);
        } else {
          assert.equal(rpcIndices.length, 1);
          transfer.setSubaddressIndex(rpcIndices[0].minor);
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
        if (transfer === undefined) transfer = new MoneroOutgoingTransfer({tx: tx});
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
  
  static _convertRpcTxWalletWithVout(rpcVout) {
    
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
      else if (key === "unlocked") vout.setIsUnlocked(val);
      else if (key === "frozen") vout.setIsFrozen(val);
      else if (key === "subaddr_index") {
        vout.setAccountIndex(val.major);
        vout.setSubaddressIndex(val.minor);
      }
      else if (key === "block_height") tx.setBlock(new MoneroBlock().setHeight(val).setTxs([tx]));
      else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }
    
    // initialize tx with vout
    tx.setVouts([vout]);
    return tx;
  }
  
  /**
   * Initializes a sent transaction.
   * 
   * @param {MoneroSendRequest} request is the send request
   * @param {MoneroTxWallet} is an existing transaction to initialize (optional)
   * @return {MoneroTxWallet} is the initialized send tx
   */
  static _initSentTxWallet(request, tx) {
    if (!tx) tx = new MoneroTxWallet();
    tx.setIsConfirmed(false);
    tx.setNumConfirmations(0);
    tx.setInTxPool(request.getDoNotRelay() ? false : true);
    tx.setDoNotRelay(request.getDoNotRelay() ? true : false);
    tx.setIsRelayed(!tx.getDoNotRelay());
    tx.setIsCoinbase(false);
    tx.setIsFailed(false);
    tx.setMixin(request.getMixin());
    let transfer = new MoneroOutgoingTransfer().setTx(tx);
    if (request.getSubaddressIndices() && request.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(request.getSubaddressIndices().slice(0)); // we know src subaddress indices iff request specifies 1
    let destCopies = [];
    for (let dest of request.getDestinations()) destCopies.push(dest.copy());
    transfer.setDestinations(destCopies);
    tx.setOutgoingTransfer(transfer);
    tx.setPaymentId(request.getPaymentId());
    if (tx.getUnlockTime() === undefined) tx.setUnlockTime(request.getUnlockTime() === undefined ? 0 : request.getUnlockTime());
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
    
    // pre-initialize txs if necessary
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
      else tx.setOutgoingTransfer(new MoneroOutgoingTransfer({tx: tx, amount: new BigInteger(amounts[i])}));
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
   * @param tx is the transaction to decode known fields to
   * @return {boolean} true if the rpc type indicates outgoing xor incoming
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
        
        // merge blocks which only exist when confirmed
        if (aTx.getBlock() !== undefined || tx.getBlock() !== undefined) {
          if (aTx.getBlock() === undefined) aTx.setBlock(new MoneroBlock().setTxs([aTx]).setHeight(tx.getHeight()));
          if (tx.getBlock() === undefined) tx.setBlock(new MoneroBlock().setTxs([tx]).setHeight(aTx.getHeight()));
          aTx.getBlock().merge(tx.getBlock());
        } else {
          aTx.merge(tx);
        }
        return;
      }
      
      // merge common block of different txs
      if (tx.getHeight() !== undefined && aTx.getHeight() === tx.getHeight()) {
        aTx.getBlock().merge(tx.getBlock());
      }
    }
    
    // add tx if it doesn't already exist unless skipped
    if (!skipIfAbsent) {
      txs.push(tx);
    } else {
      console.log("WARNING: tx does not already exist"); 
    }
  }
}

module.exports = MoneroWalletRpc;