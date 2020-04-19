/**
 * Copyright (c) 2017-2019 woodser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Implements a MoneroWallet as a client of monero-wallet-rpc.
 */
class MoneroWalletRpc extends MoneroWallet {
  
  /**
   * Create a client connected to monero-wallet-rpc initialized from a config
   * object, params, or an existing MoneroRpcConnection.
   * 
   * e.g. connect("http://localhost:38083", "rpc_user", "supersecretpassword");
   * 
   * @param {object|string|MoneroRpcConnection} configOrUriOrConnection is a configuration object or uri or existing MoneroRpcConnection
   * @param {string} username is the username to authenticate with the daemon
   * @param {string} password is the password to authenticate with the daemon
   * @param {boolean} rejectUnauthorized rejects unauthorized certificates if true
   * @return {MoneroWalletRpc} a wallet client created from configuration
   */
  static async connect(configOrUriOrConnection, username, password, rejectUnauthorized) {
    return new MoneroWalletRpc(configOrUriOrConnection, username, password, rejectUnauthorized);
  }
  
  /**
   * Construct a MoneroWalletRpc instance.
   * 
   * @param {object|string} configOrUri is a config object or the uri to monero-wallet-rpc
   * @param {string} username is the username to authenticate with (optional)
   * @param {string} password is the password to authenticate with (optional)
   * @param {boolean} rejectUnauthorized specifies if self-signed certificates should be rejected
   */
  constructor(configOrUriOrConnection, username, password, rejectUnauthorized) {
    super();
    
    // validate and normalize config
    if (typeof configOrUriOrConnection === "string") this.config = {uri: configOrUriOrConnection, username: username, password: password, rejectUnauthorized: rejectUnauthorized};
    else if (configOrUriOrConnection instanceof MoneroRpcConnection) this.config = Object.assign({}, configOrUriOrConnection.getConfig());
    else {
      if (typeof configOrUriOrConnection !== "object") throw new MoneroError("Invalid configuration to create wallet rpc client; must be string, object, or MoneroRpcConnection");
      this.config = Object.assign({}, configOrUriOrConnection);
      if (username || password || rejectUnauthorized) throw new MoneroError("Can provide this.config object or params on MoneroWalletRpc.connnect(...) but not both");
    }
    
    // initialize other instance variables
    this.rpc = new MoneroRpcConnection(this.config);
    this.addressCache = {}; // avoid unecessary requests for addresses
  }
  
  /**
   * Get the wallet's RPC connection.
   * 
   * @return {MoneroWalletRpc} the wallet's rpc connection
   */
  async getRpcConnection() {
    return this.rpc;
  }
  
  /**
   * Open an existing wallet on the RPC server.
   * 
   * @param {string} name is the name of the wallet file to open
   * @param {string} password is the password to decrypt the wallet file
   */
  async openWallet(name, password) {
    if (!name) throw new MoneroError("Must provide name of wallet to open");
    if (!password) throw new MoneroError("Must provide password of wallet to open");
    await this.rpc.sendJsonRequest("open_wallet", {filename: name, password: password});
    this._clear();
    this.path = name;
  }
  
  async createWallet(config) {
    
    // normalize and validate config
    if (config === undefined) throw new MoneroError("Must specify config to create wallet");
    config = config instanceof MoneroWalletConfig ? config : new MoneroWalletConfig(config);
    if (config.getNetworkType() !== undefined) throw new MoneroError("Cannot specify networkType when creating RPC wallet because server's network type is already set");
    if (config.getMnemonic() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined)) {
      throw new MoneroError("Wallet may be initialized with a mnemonic or keys but not both");
    }
    if (config.getServerUri() !== undefined || config.getServerUsername() !== undefined || config.getServerPassword() !== undefined) {
      throw new MoneroError("Cannot specify server configuration when creating RPC wallet");  // TODO: test setting wallet-rpc's daemon to support this field
    }
    
    // create wallet
    if (config.getMnemonic() !== undefined) {
      return this.createWalletFromMnemonic(config.getPath(), config.getPassword(), config.getMnemonic(), config.getRestoreHeight(), config.getLanguage(), config.getSeedOffset(), config.getSaveCurrent());
    } else if (config.getPrimaryAddress() !== undefined) {
      if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot specify seed offset when creating wallet from keys");
      return this.createWalletFromKeys(config.getPath(), config.getPassword(), config.getPrimaryAddress(), config.getPrivateViewKey(), config.getPrivateSpendKey(), config.getRestoreHeight(), config.getLanguage(), config.getSaveCurrent());
    } else {
      if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot specify seed offset when creating random wallet");
      if (config.getRestoreHeight() !== undefined) throw new MoneroError("Cannot specify restoreHeight when creating random wallet");
      if (config.getSaveCurrent() === false) throw new MoneroError("Current wallet is saved automatically when creating random wallet");
      return this.createWalletRandom(config.getPath(), config.getPassword(), config.getLanguage());
    }
  }
  
  /**
   * Create and open a new wallet with a randomly generated seed on the RPC server.
   * 
   * @param {string} name is the name of the wallet file to create
   * @param {string} password is the wallet's password
   * @param {string} language is the language for the wallet's mnemonic phrase
   */
  async createWalletRandom(name, password, language) {
    if (!name) throw new MoneroError("Name is not initialized");
    if (!password) throw new MoneroError("Password is not initialized");
    if (!language) language = MoneroWallet.DEFAULT_LANGUAGE;
    let params = { filename: name, password: password, language: language };
    await this.rpc.sendJsonRequest("create_wallet", params);
    this._clear();
    this.path = name;
  }
  
  /**
   * Create and open a wallet from an existing mnemonic phrase on the RPC server,
   * closing the currently open wallet if applicable.
   * 
   * @param {string} name is the name of the wallet to create on the RPC server
   * @param {string} password is the wallet's password
   * @param {string} mnemonic is the mnemonic of the wallet to construct
   * @param {int} restoreHeight is the block height to restore from (default = 0)
   * @param {string} language is the language of the mnemonic in case the old language is invalid
   * @param {string} seedOffset is the offset used to derive a new seed from the given mnemonic to recover a secret wallet from the mnemonic phrase
   * @param {boolean} saveCurrent specifies if the current RPC wallet should be saved before being closed
   */
  async createWalletFromMnemonic(name, password, mnemonic, restoreHeight, language, seedOffset, saveCurrent) {
    await this.rpc.sendJsonRequest("restore_deterministic_wallet", {
      filename: name,
      password: password,
      seed: mnemonic,
      seed_offset: seedOffset,
      restore_height: restoreHeight,
      language: language,
      autosave_current: saveCurrent
    });
    this._clear();
    this.path = name;
  }
  
  /**
   * Create a wallet on the RPC server from an address, view key, and (optionally) spend key.
   * 
   * @param name is the name of the wallet to create on the RPC server
   * @param password is the password encrypt the wallet
   * @param networkType is the wallet's network type
   * @param address is the address of the wallet to construct
   * @param viewKey is the view key of the wallet to construct
   * @param spendKey is the spend key of the wallet to construct or null to create a view-only wallet
   * @param restoreHeight is the block height to restore (i.e. scan the chain) from (default = 0)
   * @param language is the wallet and mnemonic's language (default = "English")
   */
  async createWalletFromKeys(name, password, address, viewKey, spendKey, restoreHeight, language, saveCurrent) {
    if (restoreHeight === undefined) restoreHeight = 0;
    if (language === undefined) language = MoneroWallet.DEFAULT_LANGUAGE;
    await this.rpc.sendJsonRequest("generate_from_keys", {
      filename: name,
      password: password,
      address: address,
      viewkey: viewKey,
      spendkey: spendKey,
      restore_height: restoreHeight,
      autosave_current: saveCurrent
    });
    this._clear();
    this.path = name;
  }
  
  async isWatchOnly() {
    try {
      await this.rpc.sendJsonRequest("query_key", {key_type: "mnemonic"});
      return false; // key retrieval succeeds if not watch only
    } catch (e) {
      if (e.getCode() === -29) return true;  // wallet is watch-only
      if (e.getCode() === -1) return false;  // wallet is offline but not watch-only
      throw e;
    }
  }
  
  async setDaemonConnection(daemonUriOrConnection, isTrusted, sslOptions) {
    if (!sslOptions) sslOptions = new SslOptions();
    let daemonConnection = typeof daemonUriOrConnection === "string" ? new MoneroDaemonConnection(daemonUriOrConnection) : (daemonUriOrConnection ? daemonUriOrConnection : undefined);
    let params = {};
    params.address = !daemonConnection ? "bad_uri" : daemonConnection.getUri(); // TODO monero-wallet-rpc: bad daemon uri necessary for offline?
    params.trusted = isTrusted;
    params.ssl_support = "autodetect";
    params.ssl_private_key_path = sslOptions.getPrivateKeyPath();
    params.ssl_certificate_path  = sslOptions.getCertificatePath();
    params.ssl_ca_file = sslOptions.getCertificateAuthorityFile();
    params.ssl_allowed_fingerprints = sslOptions.getAllowedFingerprints();
    params.ssl_allow_any_cert = sslOptions.getAllowAnyCert();
    await this.rpc.sendJsonRequest("set_daemon", params);
  }
  
  async getDaemonConnection() {
    throw new MoneroError("Not implemented");
  }
  
  async isConnected() {
    try {
      await this.sync(); // wallet rpc auto syncs so worst case this call blocks and blocks upfront  TODO: better way to determine if wallet rpc is connected to daemon?
      return true;
    } catch (e) {
      return false;
    }
  }
  
  async getVersion() {
    let resp = await this.rpc.sendJsonRequest("get_version");
    return new MoneroVersion(resp.result.version, resp.result.release);
  }
  
  async getPath() {
    return this.path;
  }
  
  async getMnemonic() {
    try {
      let resp = await this.rpc.sendJsonRequest("query_key", { key_type: "mnemonic" });
      return resp.result.key;
    } catch (e) {
      if (e.getCode() === -29) return undefined;  // wallet is watch-only
      throw e;
    }
  }
  
  async getMnemonicLanguage() {
    if (await this.getMnemonic() === undefined) return undefined;
    throw new MoneroError("MoneroWalletRpc.getMnemonicLanguage() not supported");
  }

  /**
   * Get a list of available languages for the wallet's mnemonic phrase.
   * 
   * @return {string[]} the available languages for the wallet's mnemonic phrase
   */
  async getMnemonicLanguages() {
    return (await this.rpc.sendJsonRequest("get_languages")).result.languages;
  }
  
  async getPrivateViewKey() {
    let resp = await this.rpc.sendJsonRequest("query_key", { key_type: "view_key" });
    return resp.result.key;
  }
  
  async getPrivateSpendKey() {
    
    // get private spend key which will throw error if wallet is watch-only
    try {
      let resp = await this.rpc.sendJsonRequest("query_key", { key_type: "spend_key" });
      return resp.result.key;
    } catch (e) {
      if (e.getCode() === -29 && e.message.indexOf("watch-only") !== -1) return undefined; // return undefined if wallet is watch-only
      throw e;
    }
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
      resp = await this.rpc.sendJsonRequest("get_address_index", {address: address});
    } catch (e) {
      if (e.getCode() === -2) throw new MoneroError(e.message);
      throw e;
    }
    
    // convert rpc response
    let subaddress = new MoneroSubaddress(address);
    subaddress.setAccountIndex(resp.result.index.major);
    subaddress.setIndex(resp.result.index.minor);
    return subaddress;
  }
  
  async getIntegratedAddress(paymentId) {
    try {
      let integratedAddressStr = (await this.rpc.sendJsonRequest("make_integrated_address", {payment_id: paymentId})).result.integrated_address;
      return await this.decodeIntegratedAddress(integratedAddressStr);
    } catch (e) {
      if (e.message.includes("Invalid payment ID")) throw new MoneroError("Invalid payment ID: " + paymentId);
      throw e;
    }
  }
  
  async decodeIntegratedAddress(integratedAddress) {
    let resp = await this.rpc.sendJsonRequest("split_integrated_address", {integrated_address: integratedAddress});
    return new MoneroIntegratedAddress().setStandardAddress(resp.result.standard_address).setPaymentId(resp.result.payment_id).setIntegratedAddress(integratedAddress);
  }
  
  async getHeight() {
    return (await this.rpc.sendJsonRequest("get_height")).result.height;
  }
  
  async getDaemonHeight() {
    throw new MoneroError("monero-wallet-rpc does not support getting the chain height");
  }
  
  async sync(startHeight, onProgress) {
    assert(onProgress === undefined, "Monero Wallet RPC does not support reporting sync progress");
    let resp = await this.rpc.sendJsonRequest("refresh", {start_height: startHeight});
    return new MoneroSyncResult(resp.result.blocks_fetched, resp.result.received_money);
  }
  
  async startSyncing() {
    // nothing to do because wallet rpc syncs automatically
  }
  
  async rescanSpent() {
    await this.rpc.sendJsonRequest("rescan_spent");
  }
  
  async rescanBlockchain() {
    await this.rpc.sendJsonRequest("rescan_blockchain");
  }
  
  async getBalance(accountIdx, subaddressIdx) {
    return (await this._getBalances(accountIdx, subaddressIdx))[0];
  }
  
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    return (await this._getBalances(accountIdx, subaddressIdx))[1];
  }
  
  async getAccounts(includeSubaddresses, tag, skipBalances) {
    
    // fetch accounts from rpc
    let resp = await this.rpc.sendJsonRequest("get_accounts", {tag: tag});
    
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
      resp = await this.rpc.sendJsonRequest("get_balance", {all_accounts: true});
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
    let resp = await this.rpc.sendJsonRequest("create_account", {label: label});
    return new MoneroAccount(resp.result.account_index, resp.result.address, new BigInteger(0), new BigInteger(0));
  }

  async getSubaddresses(accountIdx, subaddressIndices, skipBalances) {
    
    // fetch subaddresses
    let params = {};
    params.account_index = accountIdx;
    if (subaddressIndices) params.address_index = GenUtils.listify(subaddressIndices);
    let resp = await this.rpc.sendJsonRequest("get_address", params);
    
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
      resp = await this.rpc.sendJsonRequest("get_balance", params);
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
    let resp = await this.rpc.sendJsonRequest("create_address", {account_index: accountIdx, label: label});
    
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
  
  async getTxs(query) {
    
    // copy and normalize query up to block
    query = MoneroWallet._normalizeTxQuery(query);
    
    // temporarily disable transfer and output queries in order to collect all tx information
    let transferQuery = query.getTransferQuery();
    let outputQuery = query.getOutputQuery();
    query.setTransferQuery(undefined);
    query.setOutputQuery(undefined);
    
    // fetch all transfers that meet tx query
    let transfers = await this.getTransfers(new MoneroTransferQuery().setTxQuery(query));
    
    // collect unique txs from transfers while retaining order
    let txs = [];
    let txsSet = new Set();
    for (let transfer of transfers) {
      if (!txsSet.has(transfer.getTx())) {
        txs.push(transfer.getTx());
        txsSet.add(transfer.getTx());
      }
    }
    
    // cache types into maps for merging and lookup
    let txMap = new Map();
    let blockMap = new Map();
    for (let tx of txs) {
      MoneroWalletRpc._mergeTx(tx, txMap, blockMap, false);
    }
    
    // fetch and merge outputs if requested
    if (query.getIncludeOutputs() || !outputQuery.isDefault()) {
      let outputs = await this.getOutputs(new MoneroOutputQuery().setTxQuery(query));
      
      // merge output txs one time while retaining order
      let outputTxs = [];
      for (let output of outputs) {
        if (!outputTxs.includes(output.getTx())) {
          MoneroWalletRpc._mergeTx(output.getTx(), txMap, blockMap, true);
          outputTxs.push(output.getTx());
        }
      }
    }
    
    // restore transfer and output queries
    query.setTransferQuery(transferQuery);
    query.setOutputQuery(outputQuery);
    
    // filter txs that don't meet transfer query
    transferQuery.setTxQuery(undefined);  // break circular reference for meets criteria TODO: meetsCriteria should handle loop
    outputQuery.setTxQuery(undefined);
    let txsQueried = [];
    for (let tx of txs) {
      if (query.meetsCriteria(tx)) txsQueried.push(tx);
      else if (tx.getBlock() !== undefined) tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
    }
    txs = txsQueried;
    
    // verify all specified tx hashes found
    if (query.getTxHashes()) {
      for (let txHash of query.getTxHashes()) {
        let found = false;
        for (let tx of txs) {
          if (txHash === tx.getHash()) {
            found = true;
            break;
          }
        }
        if (!found) throw new MoneroError("Tx not found in wallet: " + txHash);
      }
    }
    
    // special case: re-fetch txs if inconsistency caused by needing to make multiple rpc calls
    for (let tx of txs) {
      if (tx.isConfirmed() && tx.getBlock() === undefined) return this.getTxs(query);
    }
    
    // order txs if tx hashes given then return
    if (query.getTxHashes() && query.getTxHashes().length > 0) {
      let txsById = new Map()  // store txs in temporary map for sorting
      for (let tx of txs) txsById.set(tx.getHash(), tx);
      let orderedTxs = [];
      for (let txHash of query.getTxHashes()) if (txsById.get(txHash)) orderedTxs.push(txsById.get(txHash));
      txs = orderedTxs;
    }
    return txs;
  }
  
  async getTransfers(query) {
    
    // copy and normalize query up to block
    query = MoneroWallet._normalizeTransferQuery(query);
    let txQuery = query.getTxQuery();
    txQuery.setTransferQuery(undefined); // break circular link for meetsCriteria()
    
    // check if pool txs explicitly requested without daemon connection
    if (txQuery.inTxPool() !== undefined && txQuery.inTxPool() && !await this.isConnected()) {
      throw new MoneroError("Cannot fetch pool transactions because because wallet has no daemon connection");
    }
    
    // build params for get_transfers rpc call
    let params = {};
    let canBeConfirmed = txQuery.isConfirmed() !== false && txQuery.inTxPool() !== true && txQuery.isFailed() !== true && txQuery.isRelayed() !== false;
    let canBeInTxPool = await this.isConnected() && txQuery.isConfirmed() !== true && txQuery.inTxPool() !== false && txQuery.isFailed() !== true && txQuery.isRelayed() !== false && txQuery.getHeight() === undefined && txQuery.getMinHeight() === undefined && txQuery.getMaxHeight() === undefined;
    let canBeIncoming = query.isIncoming() !== false && query.isOutgoing() !== true && query.hasDestinations() !== true;
    let canBeOutgoing = query.isOutgoing() !== false && query.isIncoming() !== true;
    params.in = canBeIncoming && canBeConfirmed;
    params.out = canBeOutgoing && canBeConfirmed;
    params.pool = canBeIncoming && canBeInTxPool;
    params.pending = canBeOutgoing && canBeInTxPool;
    params.failed = txQuery.isFailed() !== false && txQuery.isConfirmed() !== true && txQuery.inTxPool() != true;
    if (txQuery.getMinHeight() !== undefined) {
      if (txQuery.getMinHeight() > 0) params.min_height = txQuery.getMinHeight() - 1; // TODO monero core: wallet2::get_payments() min_height is exclusive, so manually offset to match intended range (issues #5751, #5598)
      else params.min_height = txQuery.getMinHeight();
    }
    if (txQuery.getMaxHeight() !== undefined) params.max_height = txQuery.getMaxHeight();
    params.filter_by_height = txQuery.getMinHeight() !== undefined || txQuery.getMaxHeight() !== undefined;
    if (query.getAccountIndex() === undefined) {
      assert(query.getSubaddressIndex() === undefined && query.getSubaddressIndices() === undefined, "Query specifies a subaddress index but not an account index");
      params.all_accounts = true;
    } else {
      params.account_index = query.getAccountIndex();
      
      // set subaddress indices param
      let subaddressIndices = new Set();
      if (query.getSubaddressIndex() !== undefined) subaddressIndices.add(query.getSubaddressIndex());
      if (query.getSubaddressIndices() !== undefined) query.getSubaddressIndices().map(subaddressIdx => subaddressIndices.add(subaddressIdx));
      if (subaddressIndices.size) params.subaddr_indices = Array.from(subaddressIndices);
    }
    
    // cache unique txs and blocks
    let txMap = {};
    let blockMap = {};
    
    // build txs using `get_transfers`
    let resp = await this.rpc.sendJsonRequest("get_transfers", params);
    for (let key of Object.keys(resp.result)) {
      for (let rpcTx of resp.result[key]) {
        //if (rpcTx.txid === query.debugTxId) console.log(rpcTx);
        let tx = MoneroWalletRpc._convertRpcTxWithTransfer(rpcTx);
        if (tx.isConfirmed()) assert(tx.getBlock().getTxs().indexOf(tx) > -1);
        
        // replace transfer amount with destination sum
        // TODO monero-wallet-rpc: confirmed tx from/to same account has amount 0 but cached transfers
        if (tx.getOutgoingTransfer() !== undefined && tx.isRelayed() && !tx.isFailed() &&
            tx.getOutgoingTransfer().getDestinations() && tx.getOutgoingAmount().compare(new BigInteger(0)) === 0) {
          let outgoingTransfer = tx.getOutgoingTransfer();
          let transferTotal = new BigInteger(0);
          for (let destination of outgoingTransfer.getDestinations()) transferTotal = transferTotal.add(destination.getAmount());
          tx.getOutgoingTransfer().setAmount(transferTotal);
        }
        
        // merge tx
        MoneroWalletRpc._mergeTx(tx, txMap, blockMap, false);
      }
    }
    
    // sort txs by block height
    let txs = Object.values(txMap);
    txs.sort(MoneroWalletRpc._compareTxsByHeight);
    
    // filter and return transfers
    let transfers = [];
    for (let tx of txs) {
      
      // tx is not incoming/outgoing unless already set
      if (tx.isIncoming() === undefined) tx.setIsIncoming(false);
      if (tx.isOutgoing() === undefined) tx.setIsOutgoing(false);
      
      // sort transfers
      if (tx.getIncomingTransfers() !== undefined) tx.getIncomingTransfers().sort(MoneroWalletRpc._compareIncomingTransfers);
      
      // collect outgoing transfer, erase if filtered
      if (tx.getOutgoingTransfer() !== undefined && query.meetsCriteria(tx.getOutgoingTransfer())) transfers.push(tx.getOutgoingTransfer());
      else tx.setOutgoingTransfer(undefined);
      
      // collect incoming transfers, erase if filtered
      if (tx.getIncomingTransfers() !== undefined) {
        let toRemoves = [];
        for (let transfer of tx.getIncomingTransfers()) {
          if (query.meetsCriteria(transfer)) transfers.push(transfer);
          else toRemoves.push(transfer);
        }
        
        // remove excluded transfers
        tx.setIncomingTransfers(tx.getIncomingTransfers().filter(function(transfer) {
          return !toRemoves.includes(transfer);
        }));
        if (tx.getIncomingTransfers().length === 0) tx.setIncomingTransfers(undefined);
      }
      
      // remove txs without requested transfer
      if (tx.getBlock() !== undefined && tx.getOutgoingTransfer() === undefined && tx.getIncomingTransfers() === undefined) {
        tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
      }
    }
    
    return transfers;
  }
  
  async getOutputs(query) {
    
    // copy and normalize query up to block
    query = MoneroWallet._normalizeOutputQuery(query);
    let txQuery = query.getTxQuery();
    txQuery.setOutputQuery(undefined); // break circular link for meetsCriteria()
    
    // determine account and subaddress indices to be queried
    let indices = new Map();
    if (query.getAccountIndex() !== undefined) {
      let subaddressIndices = new Set();
      if (query.getSubaddressIndex() !== undefined) subaddressIndices.add(query.getSubaddressIndex());
      if (query.getSubaddressIndices() !== undefined) query.getSubaddressIndices().map(subaddressIdx => subaddressIndices.add(subaddressIdx));
      indices.set(query.getAccountIndex(), subaddressIndices.size ? Array.from(subaddressIndices) : undefined);  // undefined will fetch from all subaddresses
    } else {
      assert.equal(query.getSubaddressIndex(), undefined, "Query specifies a subaddress index but not an account index")
      assert(query.getSubaddressIndices() === undefined || query.getSubaddressIndices().length === 0, "Query specifies subaddress indices but not an account index");
      indices = await this._getAccountIndices();  // fetch all account indices without subaddresses
    }
    
    // cache unique txs and blocks
    let txMap = {};
    let blockMap = {};
    
    // collect txs with outputs for each indicated account using `incoming_transfers` rpc call
    let params = {};
    params.transfer_type = query.isSpent() === true ? "unavailable" : query.isSpent() === false ? "available" : "all";
    params.verbose = true;
    for (let accountIdx of indices.keys()) {
    
      // send request
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.rpc.sendJsonRequest("incoming_transfers", params);
      
      // convert response to txs with outputs and merge
      if (resp.result.transfers === undefined) continue;
      for (let rpcOutput of resp.result.transfers) {
        let tx = MoneroWalletRpc._convertRpcTxWalletWithOutput(rpcOutput);
        MoneroWalletRpc._mergeTx(tx, txMap, blockMap, false);
      }
    }
    
    // sort txs by block height
    let txs = Object.values(txMap);
    txs.sort(MoneroWalletRpc._compareTxsByHeight);
    
    // collect queried outputs
    let outputs = [];
    for (let tx of txs) {
      
      // sort outputs
      if (tx.getOutputs() !== undefined) tx.getOutputs().sort(MoneroWalletRpc._compareOutputs);
      
      // collect queried outputs
      let toRemoves = [];
      for (let output of tx.getOutputs()) {
        if (query.meetsCriteria(output)) outputs.push(output);
        else toRemoves.push(output);
      }
      
      // remove excluded outputs
      tx.setOutputs(tx.getOutputs().filter(function(output) { return !toRemoves.includes(output); }))
      
      // remove excluded txs from block
      if ((tx.getOutputs() === undefined || tx.getOutputs().length === 0) && tx.getBlock() !== undefined) {
        tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
      }
    }
    return outputs;
  }
  
  async getOutputsHex() {
    return (await this.rpc.sendJsonRequest("export_outputs")).result.outputs_data_hex;
  }
  
  async importOutputsHex(outputsHex) {
    let resp = await this.rpc.sendJsonRequest("import_outputs", {outputs_data_hex: outputsHex});
    return resp.result.num_imported;
  }
  
  async getKeyImages() {
    return await this._rpcExportKeyImages(true);
  }
  
  async importKeyImages(keyImages) {
    
    // convert key images to rpc parameter
    let rpcKeyImages = keyImages.map(keyImage => ({key_image: keyImage.getHex(), signature: keyImage.getSignature()}));
    
    // send request
    let resp = await this.rpc.sendJsonRequest("import_key_images", {signed_key_images: rpcKeyImages});
    
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
  
  async relayTxs(txsOrMetadatas) {
    assert(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
    let txHashes = [];
    for (let txOrMetadata of txsOrMetadatas) {
      let metadata = txOrMetadata instanceof MoneroTxWallet ? txOrMetadata.getMetadata() : txOrMetadata;
      let resp = await this.rpc.sendJsonRequest("relay_tx", { hex: metadata });
      txHashes.push(resp.result.tx_hash);
    }
    return txHashes;
  }

  async sendTxs(requestOrAccountIndex, address, amount, priority) {
    
    // validate, copy, and normalize request
    let request = MoneroWallet._normalizeSendRequest(requestOrAccountIndex, address, amount, priority);
    if (request.getCanSplit() === undefined) request.setCanSplit(true);

    // determine account and subaddresses to send from
    let accountIdx = request.getAccountIndex();
    if (accountIdx === undefined) throw new MoneroError("Must specify the account index to send from");
    let subaddressIndices = request.getSubaddressIndices() === undefined ? undefined : request.getSubaddressIndices().slice(0); // fetch all or copy given indices
    
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
    params.unlock_time = request.getUnlockTime();
    params.do_not_relay = request.getDoNotRelay();
    assert(request.getPriority() === undefined || request.getPriority() >= 0 && request.getPriority() <= 3);
    params.priority = request.getPriority();
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    if (request.getCanSplit()) params.get_tx_keys = true; // param to get tx key(s) depends if split
    else params.get_tx_key = true;
    
    // send request
    let resp = await this.rpc.sendJsonRequest(request.getCanSplit() ? "transfer_split" : "transfer", params);
    let result = resp.result;
    
    // pre-initialize txs iff present.  multisig and watch-only wallets will have tx set without transactions
    let txs;
    let numTxs = request.getCanSplit() ? (result.fee_list !== undefined ? result.fee_list.length : 0) : (result.fee !== undefined ? 1 : 0);
    if (numTxs > 0) txs = [];
    for (let i = 0; i < numTxs; i++) {
      let tx = new MoneroTxWallet();
      MoneroWalletRpc._initSentTxWallet(request, tx);
      tx.getOutgoingTransfer().setAccountIndex(accountIdx);
      if (subaddressIndices !== undefined && subaddressIndices.length === 1) tx.getOutgoingTransfer().setSubaddressIndices(subaddressIndices);
      txs.push(tx);
    }
    
    // initialize tx set from rpc response with pre-initialized txs
    if (request.getCanSplit()) return MoneroWalletRpc._convertRpcSentTxsToTxSet(result, txs);
    else return MoneroWalletRpc._convertRpcTxToTxSet(result, txs === undefined ? undefined : txs[0], true);
  }
  
  async sweepOutput(requestOrAddress, keyImage, priority) {
    
    // normalize and validate request
    let request = MoneroWallet._normalizeSweepOutputRequest(requestOrAddress, keyImage, priority);
    
    // build request parameters
    let params = {};
    params.address = request.getDestinations()[0].getAddress();
    params.account_index = request.getAccountIndex();
    params.subaddr_indices = request.getSubaddressIndices();
    params.key_image = request.getKeyImage();
    params.unlock_time = request.getUnlockTime();
    params.do_not_relay = request.getDoNotRelay();
    assert(request.getPriority() === undefined || request.getPriority() >= 0 && request.getPriority() <= 3);
    params.priority = request.getPriority();
    params.payment_id = request.getPaymentId();
    params.get_tx_key = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // send request
    let resp = await this.rpc.sendJsonRequest("sweep_single", params);
    let result = resp.result;
    
    // build and return tx response
    let tx = MoneroWalletRpc._initSentTxWallet(request, null);
    let txSet = MoneroWalletRpc._convertRpcTxToTxSet(result, tx, true);
    tx.getOutgoingTransfer().getDestinations()[0].setAmount(tx.getOutgoingTransfer().getAmount());  // initialize destination amount
    return txSet;
  }
  
  async sweepUnlocked(request) {
    
    // validate request
    if (request === undefined) throw new MoneroError("Must specify sweep request");
    if (request.getDestinations() === undefined || request.getDestinations().length != 1) throw new MoneroError("Must specify exactly one destination to sweep to");
    if (request.getDestinations()[0].getAddress() === undefined) throw new MoneroError("Must specify destination address to sweep to");
    if (request.getDestinations()[0].getAmount() !== undefined) throw new MoneroError("Cannot specify amount in sweep request");
    if (request.getKeyImage() !== undefined) throw new MoneroError("Key image defined; use sweepOutput() to sweep an output by its key image");
    if (request.getSubaddressIndices() !== undefined && request.getSubaddressIndices().length === 0) request.setSubaddressIndices(undefined);
    if (request.getAccountIndex() === undefined && request.getSubaddressIndices() !== undefined) throw new MoneroError("Must specify account index if subaddress indices are specified");
    
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
    
    // sweep from each account and collect resulting tx sets
    let txSets = [];
    for (let accountIdx of indices.keys()) {
      
      // copy and modify the original request
      let copy = request.copy();
      copy.setAccountIndex(accountIdx);
      copy.setSweepEachSubaddress(false);
      
      // sweep all subaddresses together  // TODO monero core: can this reveal outputs belong to the same wallet?
      if (copy.getSweepEachSubaddress() !== true) {
        copy.setSubaddressIndices(indices.get(accountIdx));
        txSets.push(await this._rpcSweepAccount(copy));
      }
      
      // otherwise sweep each subaddress individually
      else {
        for (let subaddressIdx of indices.get(accountIdx)) {
          copy.setSubaddressIndices([subaddressIdx]);
          txSets.push(await this._rpcSweepAccount(copy));
        }
      }
    }
    
    // return resulting tx sets
    return txSets;
  }
  
  async sweepDust(doNotRelay) {
    let resp = await this.rpc.sendJsonRequest("sweep_dust", {do_not_relay: doNotRelay});
    let result = resp.result;
    let txSet = MoneroWalletRpc._convertRpcSentTxsToTxSet(result);
    if (txSet.getTxs() !== undefined) {
      for (let tx of txSet.getTxs()) {
        tx.setIsRelayed(!doNotRelay);
        tx.setInTxPool(tx.isRelayed());
      }
    } else if (txSet.getMultisigTxHex() === undefined && txSet.getSignedTxHex() === undefined && txSet.getUnsignedTxHex() === undefined) {
      throw new MoneroError("No dust to sweep");
    }
    return txSet;
  }
  
  async parseTxSet(txSet) {
    let resp = await this.rpc.sendJsonRequest("describe_transfer", {
      unsigned_txset: txSet.getUnsignedTxHex(),
      multisig_txset: txSet.getMultisigTxHex()
    });
    return MoneroWalletRpc._convertRpcDescribeTransfer(resp.result);
  }
  
  async signTxs(unsignedTxHex) {
    let resp = await this.rpc.sendJsonRequest("sign_transfer", {
      unsigned_txset: unsignedTxHex,
      export_raw: false
    });
    return resp.result.signed_txset
  }
  
  async submitTxs(signedTxHex) {
    let resp = await this.rpc.sendJsonRequest("submit_transfer", {
      tx_data_hex: signedTxHex
    });
    return resp.result.tx_hash_list;
  }
  
  async sign(message) {
    let resp = await this.rpc.sendJsonRequest("sign", {data: message});
    return resp.result.signature;
  }
  
  async verify(message, address, signature) {
    let resp = await this.rpc.sendJsonRequest("verify", {data: message, address: address, signature: signature});
    return resp.result.good;
  }
  
  async getTxKey(txHash) {
    try {
      return (await this.rpc.sendJsonRequest("get_tx_key", {txid: txHash})).result.tx_key;
    } catch (e) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async checkTxKey(txHash, txKey, address) {
    try {
      
      // send request
      let resp = await this.rpc.sendJsonRequest("check_tx_key", {txid: txHash, tx_key: txKey, address: address});
      
      // interpret result
      let check = new MoneroCheckTx();
      check.setIsGood(true);
      check.setNumConfirmations(resp.result.confirmations);
      check.setInTxPool(resp.result.in_pool);
      check.setReceivedAmount(new BigInteger(resp.result.received));
      return check;
    } catch (e) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async getTxProof(txHash, address, message) {
    try {
      let resp = await this.rpc.sendJsonRequest("get_tx_proof", {txid: txHash, address: address, message: message});
      return resp.result.signature;
    } catch (e) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async checkTxProof(txHash, address, message, signature) {
    try {
      
      // send request
      let resp = await this.rpc.sendJsonRequest("check_tx_proof", {
        txid: txHash,
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
    } catch (e) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async getSpendProof(txHash, message) {
    try {
      let resp = await this.rpc.sendJsonRequest("get_spend_proof", {txid: txHash, message: message});
      return resp.result.signature;
    } catch (e) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async checkSpendProof(txHash, message, signature) {
    try {
      let resp = await this.rpc.sendJsonRequest("check_spend_proof", {
        txid: txHash,
        message: message,
        signature: signature
      });
      return resp.result.good;
    } catch (e) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async getReserveProofWallet(message) {
    let resp = await this.rpc.sendJsonRequest("get_reserve_proof", {
      all: true,
      message: message
    });
    return resp.result.signature;
  }
  
  async getReserveProofAccount(accountIdx, amount, message) {
    let resp = await this.rpc.sendJsonRequest("get_reserve_proof", {
      account_index: accountIdx,
      amount: amount.toString(),
      message: message
    });
    return resp.result.signature;
  }

  async checkReserveProof(address, message, signature) {
    
    // send request
    let resp = await this.rpc.sendJsonRequest("check_reserve_proof", {
      address: address,
      message: message,
      signature: signature
    });
    
    // interpret results
    let isGood = resp.result.good;
    let check = new MoneroCheckReserve();
    check.setIsGood(isGood);
    if (isGood) {
      check.setUnconfirmedSpentAmount(new BigInteger(resp.result.spent));
      check.setTotalAmount(new BigInteger(resp.result.total));
    }
    return check;
  }
  
  async getTxNotes(txHashes) {
    return (await this.rpc.sendJsonRequest("get_tx_notes", {txids: txHashes})).result.notes;
  }
  
  async setTxNotes(txHashes, notes) {
    await this.rpc.sendJsonRequest("set_tx_notes", {txids: txHashes, notes: notes});
  }
  
  async getAddressBookEntries(entryIndices) {
    let resp = await this.rpc.sendJsonRequest("get_address_book", {entries: entryIndices});
    if (!resp.result.entries) return [];
    let entries = [];
    for (let rpcEntry of resp.result.entries) {
      entries.push(new MoneroAddressBookEntry().setIndex(rpcEntry.index).setAddress(rpcEntry.address).setDescription(rpcEntry.description).setPaymentId(rpcEntry.payment_id));
    }
    return entries;
  }
  
  async addAddressBookEntry(address, description) {
    let resp = await this.rpc.sendJsonRequest("add_address_book", {address: address, description: description});
    return resp.result.index;
  }
  
  async editAddressBookEntry(index, setAddress, address, setDescription, description) {
    let resp = await this.rpc.sendJsonRequest("edit_address_book", {
      index: index,
      set_address: setAddress,
      address: address,
      set_description: setDescription,
      description: description
    });
  }
  
  async deleteAddressBookEntry(entryIdx) {
    await this.rpc.sendJsonRequest("delete_address_book", {index: entryIdx});
  }
  
  async tagAccounts(tag, accountIndices) {
    await this.rpc.sendJsonRequest("tag_accounts", {tag: tag, accounts: accountIndices});
  }

  async untagAccounts(accountIndices) {
    await this.rpc.sendJsonRequest("untag_accounts", {accounts: accountIndices});
  }

  async getAccountTags() {
    let tags = [];
    let resp = await this.rpc.sendJsonRequest("get_account_tags");
    if (resp.result.account_tags) {
      for (let rpcAccountTag of resp.result.account_tags) {
        tags.push(new MoneroAccountTag(rpcAccountTag.tag ? rpcAccountTag.tag : undefined, rpcAccountTag.label ? rpcAccountTag.label : undefined, rpcAccountTag.accounts));
      }
    }
    return tags;
  }

  async setAccountTagLabel(tag, label) {
    await this.rpc.sendJsonRequest("set_account_tag_description", {tag: tag, description: label});
  }
  
  async createPaymentUri(request) {
    assert(request, "Must provide send request to create a payment URI");
    let resp = await this.rpc.sendJsonRequest("make_uri", {
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
    let resp = await this.rpc.sendJsonRequest("parse_uri", {uri: uri});
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
  
  async getAttribute(key) {
    try {
      let resp = await this.rpc.sendJsonRequest("get_attribute", {key: key});
      return resp.result.value === "" ? undefined : resp.result.value;
    } catch (e) {
      if (e instanceof MoneroRpcError && e.getCode() === -45) return undefined;
      throw e;
    }
  }
  
  async setAttribute(key, val) {
    await this.rpc.sendJsonRequest("set_attribute", {key: key, value: val});
  }
  
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    await this.rpc.sendJsonRequest("start_mining", {
      threads_count: numThreads,
      do_background_mining: backgroundMining,
      ignore_battery: ignoreBattery
    });
  }
  
  async stopMining() {
    await this.rpc.sendJsonRequest("stop_mining");
  }
  
  async isMultisigImportNeeded() {
    let resp = await this.rpc.sendJsonRequest("get_balance");
    return resp.result.multisig_import_needed === true;
  }
  
  async getMultisigInfo() {
    let resp = await this.rpc.sendJsonRequest("is_multisig");
    let result = resp.result;
    let info = new MoneroMultisigInfo();
    info.setIsMultisig(result.multisig);
    info.setIsReady(result.ready);
    info.setThreshold(result.threshold);
    info.setNumParticipants(result.total);
    return info;
  }
  
  async prepareMultisig() {
    let resp = await this.rpc.sendJsonRequest("prepare_multisig");
    let result = resp.result;
    return result.multisig_info;
  }
  
  async makeMultisig(multisigHexes, threshold, password) {
    let resp = await this.rpc.sendJsonRequest("make_multisig", {
      multisig_info: multisigHexes,
      threshold: threshold,
      password: password
    });
    let result = resp.result;
    let msResult = new MoneroMultisigInitResult();
    msResult.setAddress(result.address);
    msResult.setMultisigHex(result.multisig_info);
    if (msResult.getAddress().length === 0) msResult.setAddress(undefined);
    if (msResult.getMultisigHex().length === 0) msResult.setMultisigHex(undefined);
    return msResult;
  }
  
  async exchangeMultisigKeys(multisigHexes, password) {
    let resp = await this.rpc.sendJsonRequest("exchange_multisig_keys", {multisig_info: multisigHexes, password: password});
    let msResult = new MoneroMultisigInitResult();
    msResult.setAddress(resp.result.address);
    msResult.setMultisigHex(resp.result.multisig_info);
    if (msResult.getAddress().length === 0) msResult.setAddress(undefined);
    if (msResult.getMultisigHex().length === 0) msResult.setMultisigHex(undefined);
    return msResult;
  }
  
  async getMultisigHex() {
    let resp = await this.rpc.sendJsonRequest("export_multisig_info");
    return resp.result.info;
  }

  async importMultisigHex(multisigHexes) {
    let resp = await this.rpc.sendJsonRequest("import_multisig_info", {info: multisigHexes});
    return resp.result.n_outputs;
  }

  async signMultisigTxHex(multisigTxHex) {
    let resp = await this.rpc.sendJsonRequest("sign_multisig", {tx_data_hex: multisigTxHex});
    let result = resp.result;
    let signResult = new MoneroMultisigSignResult();
    signResult.setSignedMultisigTxHex(result.tx_data_hex);
    signResult.setTxHashes(result.tx_hash_list);
    return signResult;
  }

  async submitMultisigTxHex(signedMultisigTxHex) {
    let resp = await this.rpc.sendJsonRequest("submit_multisig", {tx_data_hex: signedMultisigTxHex});
    return resp.result.tx_hash_list;
  }
  
  async save() {
    await this.rpc.sendJsonRequest("store");
  }
  
  async close(save) {
    if (save === undefined) save = false;
    this._clear();
    await this.rpc.sendJsonRequest("close_wallet", {autosave_current: save});
  }
  
  async isClosed() {
    try {
      await this.getPrimaryAddress();
    } catch (e) {
      return e instanceof MoneroRpcError && e.getCode() === -13 && e.message.indexOf("No wallet file") > -1;
    }
    return false;
  }
  
  /**
   * Save and close the current wallet and stop the RPC server.
   */
  async stop() {
    this._clear();
    await this.rpc.sendJsonRequest("stop_wallet");
  }
  
  // --------------------------------  PRIVATE --------------------------------
  
  async _clear() {
    delete this.addressCache;
    this.addressCache = {};
    this.path = undefined;
  }
  
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
      let resp = await this.rpc.sendJsonRequest("get_balance", params);
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
    let resp = await this.rpc.sendJsonRequest("get_address", {account_index: accountIdx});
    for (let address of resp.result.addresses) subaddressIndices.push(address.address_index);
    return subaddressIndices;
  }
  
  /**
   * Common method to get key images.
   * 
   * @param all specifies to get all xor only new images from last import
   * @return {MoneroKeyImage[]} are the key images
   */
  async _rpcExportKeyImages(all) {
    let resp = await this.rpc.sendJsonRequest("export_key_images", {all: all});
    if (!resp.result.signed_key_images) return [];
    return resp.result.signed_key_images.map(rpcImage => new MoneroKeyImage(rpcImage.key_image, rpcImage.signature));
  }
  
  async _rpcSweepAccount(request) {
    
    // validate request
    if (request === undefined) throw new MoneroError("Must specify sweep request");
    if (request.getAccountIndex() === undefined) throw new MoneroError("Must specify an account index to sweep from");
    if (request.getDestinations() === undefined || request.getDestinations().length != 1) throw new MoneroError("Must specify exactly one destination to sweep to");
    if (request.getDestinations()[0].getAddress() === undefined) throw new MoneroError("Must specify destination address to sweep to");
    if (request.getDestinations()[0].getAmount() !== undefined) throw new MoneroError("Cannot specify amount in sweep request");
    if (request.getKeyImage() !== undefined) throw new MoneroError("Key image defined; use sweepOutput() to sweep an output by its key image");
    if (request.getSubaddressIndices() !== undefined && request.getSubaddressIndices().length === 0) request.setSubaddressIndices(undefined);
    if (request.getSweepEachSubaddress()) throw new MoneroError("Cannot sweep each subaddress with RPC `sweep_all`");
    
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
    let doNotRelay = request.getDoNotRelay() !== undefined && request.getDoNotRelay();
    params.account_index = request.getAccountIndex();
    params.subaddr_indices = request.getSubaddressIndices();
    params.address = request.getDestinations()[0].getAddress();
    assert(request.getPriority() === undefined || request.getPriority() >= 0 && request.getPriority() <= 3);
    params.priority = request.getPriority();
    params.unlock_time = request.getUnlockTime();
    params.payment_id = request.getPaymentId();
    params.do_not_relay = doNotRelay;
    params.below_amount = request.getBelowAmount();
    params.get_tx_keys = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // invoke wallet rpc `sweep_all`
    let resp = await this.rpc.sendJsonRequest("sweep_all", params);
    let result = resp.result;
    
    // initialize txs from response
    let txSet = MoneroWalletRpc._convertRpcSentTxsToTxSet(result);
    
    // initialize remaining known fields
    for (let tx of txSet.getTxs()) {
      tx.setIsLocked(true);
      tx.setIsConfirmed(false);
      tx.setNumConfirmations(0);
      tx.setDoNotRelay(doNotRelay);
      tx.setInTxPool(!doNotRelay);
      tx.setIsRelayed(!doNotRelay);
      tx.setIsMinerTx(false);
      tx.setIsFailed(false);
      tx.setRingSize(MoneroUtils.RING_SIZE);
      let transfer = tx.getOutgoingTransfer();
      transfer.setAccountIndex(request.getAccountIndex());
      if (request.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(request.getSubaddressIndices());
      let destination = new MoneroDestination(request.getDestinations()[0].getAddress(), new BigInteger(transfer.getAmount()));
      transfer.setDestinations([destination]);
      tx.setOutgoingTransfer(transfer);
      tx.setPaymentId(request.getPaymentId());
      if (tx.getUnlockTime() === undefined) tx.setUnlockTime(request.getUnlockTime() === undefined ? 0 : request.getUnlockTime());
      if (!tx.getDoNotRelay()) {
        if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime());  // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
        if (tx.isDoubleSpendSeen() === undefined) tx.setIsDoubleSpend(false);
      }
    }
    return txSet;
    
    // initialize txs from response
    let txs = MoneroWalletRpc._convertRpcSentTxWallets(result, undefined);
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
      else if (key === "tag") account.setTag(val);
      else if (key === "label") { } // label belongs to first subaddress
      else console.log("WARNING: ignoring unexpected account field: " + key + ": " + val);
    }
    if ("" === account.getTag()) account.setTag(undefined);
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
   * Initializes a sent transaction.
   * 
   * @param {MoneroSendRequest} request is the send request
   * @param {MoneroTxWallet} is an existing transaction to initialize (optional)
   * @return {MoneroTxWallet} is the initialized send tx
   */
  static _initSentTxWallet(request, tx) {
    if (!tx) tx = new MoneroTxWallet();
    tx.setIsOutgoing(true);
    tx.setIsConfirmed(false);
    tx.setNumConfirmations(0);
    tx.setInTxPool(request.getDoNotRelay() ? false : true);
    tx.setDoNotRelay(request.getDoNotRelay() ? true : false);
    tx.setIsRelayed(!tx.getDoNotRelay());
    tx.setIsMinerTx(false);
    tx.setIsFailed(false);
    tx.setIsLocked(true);
    tx.setRingSize(MoneroUtils.RING_SIZE);
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
      if (tx.isDoubleSpendSeen() === undefined) tx.setIsDoubleSpend(false);
    }
    return tx;
  }
  
  /**
   * Initializes a tx set from a RPC map excluding txs.
   * 
   * @param rpcMap is the map to initialize the tx set from
   * @return MoneroTxSet is the initialized tx set
   * @return the resulting tx set
   */
  static _convertRpcTxSet(rpcMap) {
    let txSet = new MoneroTxSet();
    txSet.setMultisigTxHex(rpcMap.multisig_txset);
    txSet.setUnsignedTxHex(rpcMap.unsigned_txset);
    txSet.setSignedTxHex(rpcMap.signed_txset);
    if (txSet.getMultisigTxHex() !== undefined && txSet.getMultisigTxHex().length === 0) txSet.setMultisigTxHex(undefined);
    if (txSet.getUnsignedTxHex() !== undefined && txSet.getUnsignedTxHex().length === 0) txSet.setUnsignedTxHex(undefined);
    if (txSet.getSignedTxHex() !== undefined && txSet.getSignedTxHex().length === 0) txSet.setSignedTxHex(undefined);
    return txSet;
  }
  
  /**
   * Initializes a MoneroTxSet from from a list of rpc txs.
   * 
   * @param rpcTxs are sent rpc txs to initialize the set from
   * @param txs are existing txs to further initialize (optional)
   * @return the converted tx set
   */
  static _convertRpcSentTxsToTxSet(rpcTxs, txs) {
    
    // build shared tx set
    let txSet = MoneroWalletRpc._convertRpcTxSet(rpcTxs);
    
    // done if rpc contains no txs
    if (rpcTxs.fee_list === undefined) {
      if (txs !== undefined) throw new MoneorException("Txs must be null if rpcTxs are null");
      return txSet;
    }
    
    // get lists
    let hashes = rpcTxs.tx_hash_list;
    let keys = rpcTxs.tx_key_list;
    let blobs = rpcTxs.tx_blob_list;
    let metadatas = rpcTxs.tx_metadata_list;
    let fees = rpcTxs.fee_list;
    let amounts = rpcTxs.amount_list
    
    // ensure all lists are the same size
    let sizes = new Set();
    if (hashes !== undefined) sizes.add(hashes.length);
    if (keys !== undefined) sizes.add(keys.length);
    if (blobs !== undefined) sizes.add(blobs.length);
    if (metadatas !== undefined) sizes.add(metadatas.length);
    if (fees !== undefined) sizes.add(fees.length);
    if (amounts !== undefined) sizes.add(amounts.length);
    assert.equal(sizes.size, 1, "RPC lists are different sizes");
    
    // pre-initialize txs if none given
    if (txs !== undefined) txSet.setTxs(txs);
    else {
      txs = [];
      for (let i = 0; i < fees.length; i++) txs.push(new MoneroTxWallet());
      txSet.setTxs(txs);
    }

    // build transactions
    for (let i = 0; i < fees.length; i++) {
      let tx = txs[i];
      if (hashes !== undefined) tx.setHash(hashes[i]);
      if (keys !== undefined) tx.setKey(keys[i]);
      if (blobs !== undefined) tx.setFullHex(blobs[i]);
      if (metadatas !== undefined) tx.setMetadata(metadatas[i]);
      tx.setFee(new BigInteger(fees[i]));
      tx.setIsOutgoing(true);
      if (tx.getOutgoingTransfer() !== undefined) tx.getOutgoingTransfer().setAmount(new BigInteger(amounts[i]));
      else tx.setOutgoingTransfer(new MoneroOutgoingTransfer().setTx(tx).setAmount(new BigInteger(amounts[i])));
      tx.setTxSet(txSet); // link tx to parent set
    }
    
    return txSet;
  }
  
  /**
   * Converts a rpc tx with a transfer to a tx set with a tx and transfer.
   * 
   * @param rpcTx is the rpc tx to build from
   * @param tx is an existing tx to continue initializing (optional)
   * @param isOutgoing specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
   * @returns the initialized tx set with a tx
   */
  static _convertRpcTxToTxSet(rpcTx, tx, isOutgoing) {
    let txSet = MoneroWalletRpc._convertRpcTxSet(rpcTx);
    txSet.setTxs([MoneroWalletRpc._convertRpcTxWithTransfer(rpcTx, tx, isOutgoing).setTxSet(txSet)]);
    return txSet;
  }
  
  /**
   * Builds a MoneroTxWallet from a RPC tx.
   * 
   * @param rpcTx is the rpc tx to build from
   * @param tx is an existing tx to continue initializing (optional)
   * @param isOutgoing specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
   * @returns {MoneroTxWallet} is the initialized tx
   */
  static _convertRpcTxWithTransfer(rpcTx, tx, isOutgoing) {  // TODO: change everything to safe set
        
    // initialize tx to return
    if (!tx) tx = new MoneroTxWallet();
    
    // initialize tx state from rpc type
    if (rpcTx.type !== undefined) isOutgoing = MoneroWalletRpc._decodeRpcType(rpcTx.type, tx);
    else assert.equal(typeof isOutgoing, "boolean", "Must indicate if tx is outgoing (true) xor incoming (false) since unknown");
    
    // TODO: safe set
    // initialize remaining fields  TODO: seems this should be part of common function with DaemonRpc._convertRpcTx
    let header;
    let transfer;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "txid") tx.setHash(val);
      else if (key === "tx_hash") tx.setHash(val);
      else if (key === "fee") tx.setFee(new BigInteger(val));
      else if (key === "note") { if (val) tx.setNote(val); }
      else if (key === "tx_key") tx.setKey(val);
      else if (key === "type") { } // type already handled
      else if (key === "tx_size") tx.setSize(val);
      else if (key === "unlock_time") tx.setUnlockTime(val);
      else if (key === "locked") tx.setIsLocked(val);
      else if (key === "tx_blob") tx.setFullHex(val);
      else if (key === "tx_metadata") tx.setMetadata(val);
      else if (key === "double_spend_seen") tx.setIsDoubleSpend(val);
      else if (key === "block_height" || key === "height") {
        if (tx.isConfirmed()) {
          if (!header) header = new MoneroBlockHeader();
          header.setHeight(val);
        }
      }
      else if (key === "timestamp") {
        if (tx.isConfirmed()) {
          if (!header) header = new MoneroBlockHeader();
          header.setTimestamp(val);
        } else {
          // timestamp of unconfirmed tx is current request time
        }
      }
      else if (key === "confirmations") {
        if (!tx.isConfirmed()) tx.setNumConfirmations(0);
        else tx.setNumConfirmations(val);
      }
      else if (key === "suggested_confirmations_threshold") {
        if (transfer === undefined) transfer = (isOutgoing ? new MoneroOutgoingTransfer() : new MoneroIncomingTransfer()).setTx(tx);
        transfer.setNumSuggestedConfirmations(val);
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
        if ("" !== val && MoneroTxWallet.DEFAULT_PAYMENT_ID !== val) tx.setPaymentId(val);  // default is undefined
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
      else if (key === "destinations" || key == "recipients") {
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
      else if (key === "multisig_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
      else if (key === "unsigned_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
      else if (key === "amount_in") tx.setInputSum(new BigInteger(val));
      else if (key === "amount_out") tx.setOutputSum(new BigInteger(val));
      else if (key === "change_address") tx.setChangeAddress(val === "" ? undefined : val);
      else if (key === "change_amount") tx.setChangeAmount(new BigInteger(val));
      else if (key === "dummy_outputs") tx.setNumDummyOutputs(val);
      else if (key === "extra") tx.setExtraHex(val);
      else if (key === "ring_size") tx.setRingSize(val);
      else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }
    
    // link block and tx
    if (header) tx.setBlock(new MoneroBlock(header).setTxs([tx]));
    
    // initialize final fields
    if (transfer) {
      if (isOutgoing) {
        tx.setIsOutgoing(true);
        if (tx.getOutgoingTransfer()) tx.getOutgoingTransfer().merge(transfer);
        else tx.setOutgoingTransfer(transfer);
      } else {
        tx.setIsIncoming(true);
        tx.setIncomingTransfers([transfer]);
      }
    }
    
    // return initialized transaction
    return tx;
  }
  
  static _convertRpcTxWalletWithOutput(rpcOutput) {
    
    // initialize tx
    let tx = new MoneroTxWallet();
    tx.setIsConfirmed(true);
    tx.setIsRelayed(true);
    tx.setIsFailed(false);
    
    // initialize output
    let output = new MoneroOutputWallet({tx: tx});
    for (let key of Object.keys(rpcOutput)) {
      let val = rpcOutput[key];
      if (key === "amount") output.setAmount(new BigInteger(val));
      else if (key === "spent") output.setIsSpent(val);
      else if (key === "key_image") output.setKeyImage(new MoneroKeyImage(val));
      else if (key === "global_index") output.setIndex(val);
      else if (key === "tx_hash") tx.setHash(val);
      else if (key === "unlocked") tx.setIsLocked(!val);
      else if (key === "frozen") output.setIsFrozen(val);
      else if (key === "subaddr_index") {
        output.setAccountIndex(val.major);
        output.setSubaddressIndex(val.minor);
      }
      else if (key === "block_height") tx.setBlock(new MoneroBlock().setHeight(val).setTxs([tx]));
      else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }
    
    // initialize tx with output
    tx.setOutputs([output]);
    return tx;
  }
  
  static _convertRpcDescribeTransfer(rpcDescribeTransferResult) {
    let txSet = new MoneroTxSet();
    for (let key of Object.keys(rpcDescribeTransferResult)) {
      let val = rpcDescribeTransferResult[key];
      if (key === "desc") {
        txSet.setTxs([]);
        for (let txMap of val) {
          let tx = MoneroWalletRpc._convertRpcTxWithTransfer(txMap, undefined, true);
          txSet.getTxs().push(tx);
        }
      }
      else console.log("WARNING: ignoring unexpected descdribe transfer field: " + key + ": " + val);
    }
    return txSet;
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
      tx.setIsMinerTx(false);
    } else if (rpcType === "out") {
      isOutgoing = true;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "pool") {
      isOutgoing = false;
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);  // TODO: but could it be?
    } else if (rpcType === "pending") {
      isOutgoing = true;
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "block") {
      isOutgoing = false;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(false);
      tx.setIsMinerTx(true);
    } else if (rpcType === "failed") {
      isOutgoing = true;
      tx.setIsConfirmed(false);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setDoNotRelay(false);
      tx.setIsFailed(true);
      tx.setIsMinerTx(false);
    } else {
      throw new MoneroError("Unrecognized transfer type: " + rpcType);
    }
    return isOutgoing;
  }
  
  /**
   * Merges a transaction into a unique set of transactions.
   *
   * TODO monero core: skipIfAbsent only necessary because incoming payments not returned
   * when sent from/to same account #4500
   *
   * @param tx is the transaction to merge into the existing txs
   * @param txMap maps tx hashes to txs
   * @param blockMap maps block heights to blocks
   * @param skipIfAbsent specifies if the tx should not be added if it doesn't already exist
   */
  static _mergeTx(tx, txMap, blockMap, skipIfAbsent) {
    assert(tx.getHash() !== undefined);

    // if tx doesn't exist, add it (unless skipped)
    let aTx = txMap[tx.getHash()];
    if (aTx === undefined) {
      if (!skipIfAbsent) {
        txMap[tx.getHash()] = tx;
      } else {
        console.log("WARNING: tx does not already exist");
      }
    }

    // otherwise merge with existing tx
    else {
      aTx.merge(tx);
    }

    // if confirmed, merge tx's block
    if (tx.getHeight() !== undefined) {
      let aBlock = blockMap[tx.getHeight()];
      if (aBlock === undefined) {
        blockMap[tx.getHeight()] = tx.getBlock();
      } else {
        aBlock.merge(tx.getBlock());
      }
    }
  }
  
  /**
   * Compares two transactions by their height.
   */
  static _compareTxsByHeight(tx1, tx2) {
    if (tx1.getHeight() === undefined && tx2.getHeight() === undefined) return 0; // both unconfirmed
    else if (tx1.getHeight() === undefined) return 1;   // tx1 is unconfirmed
    else if (tx2.getHeight() === undefined) return -1;  // tx2 is unconfirmed
    let diff = tx1.getHeight() - tx2.getHeight();
    if (diff !== 0) return diff;
    return tx1.getBlock().getTxs().indexOf(tx1) - tx2.getBlock().getTxs().indexOf(tx2); // txs are in the same block so retain their original order
  }
  
  /**
   * Compares two transfers by ascending account and subaddress indices.
   */
  static _compareIncomingTransfers(t1, t2) {
    if (t1.getAccountIndex() < t2.getAccountIndex()) return -1;
    else if (t1.getAccountIndex() === t2.getAccountIndex()) return t1.getSubaddressIndex() - t2.getSubaddressIndex();
    return 1;
  }
  
  /**
   * Compares two outputs by ascending account and subaddress indices.
   */
  static _compareOutputs(o1, o2) {
    
    // compare by height
    let heightComparison = MoneroWalletRpc._compareTxsByHeight(o1.getTx(), o2.getTx());
    if (heightComparison !== 0) return heightComparison;
    
    // compare by account index, subaddress index, and output
    if (o1.getAccountIndex() < o2.getAccountIndex()) return -1;
    else if (o1.getAccountIndex() === o2.getAccountIndex()) {
      let compare = o1.getSubaddressIndex() - o2.getSubaddressIndex();
      if (compare !== 0) return compare;
      return o1.getIndex() - o2.getIndex();
    }
    return 1;
  }
}

module.exports = MoneroWalletRpc;