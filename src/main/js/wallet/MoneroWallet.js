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

// import wallet models
require("./model/MoneroWalletModel")();

/**
 * Monero wallet interface and default implementations.
 */
class MoneroWallet {
  
  /**
   * Gets the version of the wallet.
   * 
   * @return {MoneroVersion} the version of the wallet
   */
  async getVersion() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's path.
   * 
   * @return {string} the path the wallet can be opened with
   */
  async getPath() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's mnemonic phrase derived from the seed.
   * 
   * @return {string} the wallet's mnemonic phrase
   */
  async getMnemonic() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the language of the wallet's mnemonic phrase.
   * 
   * @return {string} the language of the wallet's mnemonic phrase
   */
  async getMnemonicLanguage() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a list of available languages for the wallet's mnemonic phrase.
   * 
   * @return {string[]} the available languages for the wallet's mnemonic phrase
   */
  async getLanguages() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's private view key.
   * 
   * @return {string} the wallet's private view key
   */
  async getPrivateViewKey() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's private spend key.
   * 
   * @return {string} the wallet's private spend key
   */
  async getPrivateSpendKey() {
    throw new MoneroError("Subclass must implement");
  }
    
  /**
   * Get the wallet's primary address.
   * 
   * @return {string} the wallet's primary address
   */
  async getPrimaryAddress() {
    return await this.getAddress(0, 0);
  }
  
  /**
   * Get the address of a specific subaddress.
   * 
   * @param {int} accountIdx specifies the account index of the address's subaddress
   * @param {int} subaddressIdx specifies the subaddress index within the account
   * @return {string} the receive address of the specified subaddress
   */
  async getAddress(accountIdx, subaddressIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the account and subaddress index of the given address.
   * 
   * @param {string} address is the address to get the account and subaddress index from
   * @return {MoneroSubaddress} the account and subaddress indices
   */
  async getAddressIndex(address) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get an integrated address based on this wallet's primary address and a
   * randomly generated payment ID.  Generates a random payment ID if none is
   * given.
   * 
   * @return {MoneroIntegratedAddress} the integrated address
   */
  async getIntegratedAddress() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get an integrated address based on this wallet's primary address and the
   * given payment ID.  Generates a random payment ID if none is given.
   * 
   * @param {string} paymentId is the payment ID to generate an integrated address from (randomly generated if undefined)
   * @return {MoneroIntegratedAddress} the integrated address
   */
  async getIntegratedAddress(paymentId) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Decode an integrated address to get its standard address and payment id.
   * 
   * @param {string} integratedAddress is an integrated address to decode
   * @return {MoneroIntegratedAddress} the decoded integrated address including standard address and payment id
   */
  async decodeIntegratedAddress(integratedAddress) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the height of the last block processed by the wallet (its index + 1).
   * 
   * @return {int} the height of the last block processed by the wallet
   */
  async getHeight() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the blockchain's height.
   * 
   * @return {int} the blockchain's height
   */
  async getDaemonHeight() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Synchronize the wallet with the daemon as a one-time synchronous process.
   * 
   * @param {int} startHeight is the start height to sync from, syncs from the last synced block by default
   * @param {function} onProgress({percent: , message: , totalBlocks: , doneBlocks: }) is invoked as progress is made
   */
  async sync(startHeight, onProgress) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Start an asynchronous thread to continuously synchronize the wallet with the daemon.
   */
  async startSyncing() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Rescan the blockchain for spent outputs.
   *
   * Note: this can only be called with a trusted daemon.
   *
   * Example use case: peer multisig hex is import when connected to an untrusted daemon,
   * so the wallet will not rescan spent outputs.  Then the wallet connects to a trusted
   * daemon.  This method should be manually invoked to rescan outputs.
   */
  async rescanSpent() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Rescan the blockchain from scratch, losing any information which cannot be recovered from
   * the blockchain itself.
   * 
   * WARNING: This method discards local wallet data like destination addresses, tx secret keys,
   * tx notes, etc.
   */
  async rescanBlockchain() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's balance.
   * 
   * @return {BigInteger} the wallet's balance
   */
  async getBalance() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get an account's balance.
   * 
   * @param {int} accountIdx is the index of the account to get the balance of
   * @return {BigInteger} the account's balance
   */
  async getBalance(accountIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a subaddress's balance.
   * 
   * @param {int} accountIdx is the index of the subaddress's account to get the balance of
   * @param {int} subaddressIdx is the index of the subaddress to get the balance of
   * @return {BigInteger} the subaddress's balance
   */
  async getBalance(accountIdx, subaddressIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's unlocked balance.
   * 
   * @return {BigInteger} the wallet's unlocked balance
   */
  async getUnlockedBalance() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get an account's unlocked balance.
   * 
   * @param {int} accountIdx is the index of the account to get the unlocked balance of
   * @return {BigInteger} the account's unlocked balance
   */
  async getUnlockedBalance(accountIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a subaddress's unlocked balance.
   * 
   * @param {int} accountIdx is the index of the subaddress's account to get the unlocked balance of
   * @param {int} subaddressIdx is the index of the subaddress to get the unlocked balance of
   * @return {BigInteger} the subaddress's balance
   */
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get all accounts.
   * 
   * @return {MoneroAccount[]} all accounts
   */
  async getAccounts() {
    throw new MoneroError("Subclass must implement");
  }
  
  // TODO: overloaded getAccounts() probably are not needed, only one is used in RPC and WASM implementations
  
  /**
   * Get all accounts.
   * 
   * @param {boolean} includeSubaddresses specifies if subaddresses should be included
   * @return {MoneroAccount[]} all accounts
   */
  async getAccounts(includeSubaddresses) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get accounts with a given tag.
   * 
   * @param {string} tag is the tag for filtering accounts, all accounts if undefined
   * @return {MoneroAccount[]} all accounts with the given tag
   */
  async getAccounts(tag) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get accounts with a given tag.
   * 
   * @param {boolean} includeSubaddresses specifies if subaddresses should be included
   * @param {string} tag is the tag for filtering accounts, all accounts if undefined
   * @return {MoneroAccount[]} all accounts with the given tag
   */
  async getAccounts(includeSubaddresses, tag) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get an account without subaddress information.
   * 
   * @param {int} accountIdx specifies the account to get
   * @return {MoneroAccount} the retrieved account
   */
  async getAccount(accountIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get an account.
   * 
   * @param {int} accountIdx specifies the account to get
   * @param {boolean} includeSubaddresses specifies if subaddresses should be included
   * @return {MoneroAccount} the retrieved account
   */
  async getAccount(accountIdx, includeSubaddresses) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Create a new account.
   * 
   * @return {MoneroAccount} the created account
   */
  async createAccount() {
    throw new MoneroError("Subclass must implement");
  }

  /**
   * Create a new account with a label for the first subaddress.
   * 
   * @param {string} label specifies the label for account's first subaddress (optional)
   * @return {MoneroAccount} the created account
   */
  async createAccount(label) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get all subaddresses in an account.
   * 
   * @param {int} accountIdx specifies the account to get subaddresses within
   * @return {MoneroSubaddress[]} the retrieved subaddresses
   */
  async getSubaddresses(accountIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get subaddresses in an account.
   * 
   * @param {int} accountIdx specifies the account to get subaddresses within
   * @param {int[]} subaddressIndices are specific subaddresses to get (optional)
   * @return {MoneroSubaddress[]} the retrieved subaddresses
   */
  async getSubaddresses(accountIdx, subaddressIndices) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a subaddress.
   * 
   * @param {int} accountIdx specifies the index of the subaddress's account
   * @param {int} subaddressIdx specifies index of the subaddress within the account
   * @return {MoneroSubaddress} the retrieved subaddress
   */
  async getSubaddress(accountIdx, subaddressIdx) {
    assert(accountIdx >= 0);
    assert(subaddressIdx >= 0);
    return (await this.getSubaddresses(accountIdx, subaddressIdx))[0];
  }
  
  /**
   * Create a subaddress within an account and without a label.
   * 
   * @param {int} accountIdx specifies the index of the account to create the subaddress within
   * @return {MoneroSubaddress} the created subaddress
   */
  async createSubaddress(accountIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Create a subaddress within an account.
   * 
   * @param {int} accountIdx specifies the index of the account to create the subaddress within
   * @param {string} label specifies the the label for the subaddress (optional)
   * @return {MoneroSubaddress} the created subaddress
   */
  async createSubaddress(accountIdx, label) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a wallet transaction by hash.
   * 
   * @param {string} txHash is an hash of a transaction to get
   * @return {MoneroTxWallet} the identified transactions
   */
  async getTx(txHash) {
    return (await this.getTxs([txHash]))[0];
  }
  
  /**
   * Get wallet transactions.  Wallet transactions contain one or more
   * transfers that are either incoming or outgoing to the wallet.
   * 
   * Query results can be filtered by passing in a transaction query.
   * Transactions must meet every criteria defined in the query in order to
   * be returned.  All filtering is optional and no filtering is applied when
   * not defined.
   * 
   * Transactions can be fetched by a MoneroTxQuery, equivalent js object, or
   * array of tx hashes.
   * 
   * @param {(MoneroTxQuery|string[]|object)} query configures the query (optional)
   * @param {boolean} query.isConfirmed gets txs that are confirmed or not (optional)
   * @param {boolean} query.inTxPool get txs that are in the tx pool or not (optional)
   * @param {boolean} query.isRelayed gets txs that are relayed or not (optional)
   * @param {boolean} query.isFailed gets txs that are failed or not (optional)
   * @param {boolean} query.isMinerTx gets miner txs or not (optional)
   * @param {string} query.hash gets a tx with the hash (optional)
   * @param {string} query.txHash gets a tx with the hash (alias of hash) (optional)
   * @param {string[]} query.txHashes gets txs with the hashes (optional)
   * @param {string} query.paymentId gets transactions with the payment id (optional)
   * @param {string[]} query.paymentIds gets transactions with the payment ids (optional)
   * @param {boolean} query.hasPaymentId gets transactions with a payment id or not (optional)
   * @param {int} query.minHeight gets txs with height >= the given height (optional)
   * @param {int} query.maxHeight gets txs with height <= the given height (optional)
   * @param {boolean} query.isOutgoing gets txs with an outgoing transfer or not (optional)
   * @param {boolean} query.isIncoming gets txs with an incoming transfer or not (optional)
   * @param {MoneroTransferQuery} query.transferQuery gets txs that have a transfer that meets this query (optional)
   * @param {boolean} query.includeOutputs specifies that tx vouts should be returned with tx results (optional)
   * @return {MoneroTxWallet[]} are wallet transactions per the configuration
   */
  async getTxs(query) {
    throw new MoneroError("Subclass must implement");
  }

  /**
   * Get incoming and outgoing transfers to and from this wallet.  An outgoing
   * transfer represents a total amount sent from one or more subaddresses
   * within an account to individual destination addresses, each with their
   * own amount.  An incoming transfer represents a total amount received into
   * a subaddress within an account.  Transfers belong to transactions which
   * are stored on the blockchain.
   * 
   * Query results can be configured or filtered by passing in a configuration.
   * Transfers must meet every criteria defined in the configuration in order
   * to be returned.  All configuration is optional and no filtering is applied
   * when not defined.
   * 
   * @param {(MoneroTransferQuery|object)} query configures the query (optional)
   * @param {boolean} query.isOutgoing gets transfers that are outgoing or not (optional)
   * @param {boolean} query.isIncoming gets transfers that are incoming or not (optional)
   * @param {string} query.address is the wallet's address that a transfer either originated from (if outgoing) or is destined for (if incoming) (optional)
   * @param {int} query.accountIndex gets transfers that either originated from (if outgoing) or are destined for (if incoming) a specific account index (optional)
   * @param {int} query.subaddressIndex gets transfers that either originated from (if outgoing) or are destined for (if incoming) a specific subaddress index (optional)
   * @param {int[]} query.subaddressIndices gets transfers that either originated from (if outgoing) or are destined for (if incoming) specific subaddress indices (optional)
   * @param {BigInteger} query.amount is the amount being transferred (optional)
   * @param {MoneroDestination[]} query.destinations are individual destinations of an outgoing transfer, which is local wallet data and NOT recoverable from the blockchain (optional)
   * @param {boolean} query.hasDestinations gets transfers that have destinations or not (optional)
   * @param {MoneroTxQuery} query.txQuery gets transfers whose transaction meets this query (optional)
   * @return {MoneroTransfer[]} are wallet transfers per the configuration
   */
  async getTransfers(query) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get all of the wallet's incoming transfers.
   * 
   * @param query is passed to getTransfers() with isIncoming=true
   * @return {MoneroIncomingTransfer[]} the wallet's incoming transfers
   */
  async getIncomingTransfers(query) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get all of the wallet's outgoing transfers.
   * 
   * @param query is passed to getTransfers() with isOutgoing=true
   * @return {MoneroOutgoingTransfer[]} the wallet's outgoing transfers
   */
  async getOutgoingTransfers(query) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get outputs created from previous transactions that belong to the wallet
   * (i.e. that the wallet can spend one time).  Outputs are part of
   * transactions which are stored in blocks on the blockchain.
   * 
   * Results can be configured by passing a MoneroOutputQuery.  Outputs must
   * meet every criteria defined in the query in order to be returned.  All
   * filtering is optional and no filtering is applied when not defined.
   * 
   * TODO: add additional filtering in MoneroOutputQuery.js meetsCriteria()
   * 
   * @param {(MoneroOutputQuery|object)} query configures the query (optional)
   * @param {int} query.accountIndex gets outputs associated with a specific account index
   * @param {int} query.subaddressIndex gets outputs associated with a specific subaddress index
   * @param {int[]} query.subaddressIndices gets outputs associated with specific subaddress indices
   * @param {BigInteger} query.amount gets outputs with a specific amount
   * @param {boolean} query.isSpent gets outputs that are spent or not
   * @param {MoneroKeyImage} query.keyImage is a key image whose defined fields filter outputs to get
   * @param {MoneroTxQuery} query.txQuery gets outputs whose transaction meets this filter (optional)
   * @return {MoneroOutputWallet[]} are wallet outputs per the configuration
   */
  async getOutputs(query) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Export all outputs in hex format.
   * 
   * @return {string} all outputs in hex format, undefined if no outputs
   */
  async getOutputsHex() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Import outputs in hex format.
   * 
   * @param {string} outputsHex are outputs in hex format
   * @return {int} the number of outputs imported
   */
  async importOutputsHex(outputsHex) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get all signed key images.
   * 
   * @return {MoneroKeyImage[]} the wallet's signed key images
   */
  async getKeyImages() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Import signed key images and verify their spent status.
   * 
   * @param {MoneroKeyImage[]} keyImages are key images to import and verify (requires hex and signature)
   * @return {MoneroKeyImageImportResult} results of the import
   */
  async importKeyImages(keyImages) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get new key images from the last imported outputs.
   * 
   * @return {MoneroKeyImage[]} the key images from the last imported outputs
   */
  async getNewKeyImagesFromLastImport() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Create a transaction to transfers funds from this wallet to a destination address.
   * The transaction may be relayed later.
   * 
   * @param {MoneroSendRequest|json|uint} requestOrAccountIndex is a send request as an object or json or a source account index
   * @param {string} address is the destination address to send funds to
   * @param {BigInteger} amount is the amount being sent
   * @param {MoneroSendPriority} priority is the send priority (default normal)
   * @return {MoneroTxSet} a tx set for the requested transaction if possible
   */
  async createTx(requestOrAccountIndex, address, amount, priority) {
    let request = MoneroWallet._normalizeSendRequest(requestOrAccountIndex, address, amount, priority);
    if (request.getCanSplit() === true) throw new MoneroException("Cannot request split transactions with createTx() which prevents splitting; use createTxs() instead");
    request.setCanSplit(false);
    return await this.createTxs(request);
  }
  
  /**
   * Create one or more transactions to transfer funds from this wallet
   * according to the given request.  The transactions may later be relayed.
   *  
   * @param {MoneroSendRequest|json|uint} requestOrAccountIndex is a send request as an object or json or a source account index
   * @param {string} address is a destination address to send to (required iff no request given)
   * @param {BigInteger} sendAmount is the amount to send (required iff no request given)
   * @return {MoneroTxSet} a tx set with the requested transactions
   */
  async createTxs(requestOrAccountIndex, address, amount, priority) {
    
    // normalize send request
    let request = MoneroWallet._normalizeSendRequest(requestOrAccountIndex, address, amount, priority);
    
    // modify request to not relay
    let requestedDoNotRelay = request.getDoNotRelay();
    request.setDoNotRelay(true);
    
    // invoke common method which doesn't relay
    let txSet = await this.sendSplit(request);
    
    // restore doNotRelay of request and txs
    request.setDoNotRelay(requestedDoNotRelay);
    if (txSet.getTxs() !== undefined) {
      for (let tx of txSet.getTxs()) tx.setDoNotRelay(requestedDoNotRelay);
    }
    
    // return results
    return txSet;
  }
  
  /**
   * Relay a previously created transaction.
   * 
   * @param {(MoneroTxWallet|string)} txOrMetadata is a transaction or its metadata to relay
   * @return {string} the hash of the relayed tx
   */
  async relayTx(txOrMetadata) {
    return (await this.relayTxs([txOrMetadata]))[0];
  }
  
  /**
   * Relay previously created transactions.
   * 
   * @param {(MoneroTxWallet[]|string[])} txsOrMetadatas are transactions or their metadata to relay
   * @return {string[]} the hashes of the relayed txs
   */
  async relayTxs(txsOrMetadatas) {
    throw new MoneroError("Subclass must implement");
  }

  /**
   * Create and relay a transaction to transfers funds from this wallet to
   * a destination address.
   *  
   * @param {MoneroSendRequest|json|uint} requestOrAccountIndex is a send request as an object or json or a source account index
   * @param {string} address is a destination address to send to (required iff no request given)
   * @param {BigInteger} sendAmount is the amount to send (required iff no request given)
   * @return {MoneroTxSet} a tx set with the requested transactions
   */
  async send(requestOrAccountIndex, address, amount, priority) {

    // normalize and validate request
    let request;
    if (requestOrAccountIndex instanceof MoneroSendRequest) {
      assert.equal(arguments.length, 1, "Sending requires a send request or parameters but not both");
      request = requestOrAccountIndex;
    } else {
      if (requestOrAccountIndex instanceof Object) request = new MoneroSendRequest(requestOrAccountIndex);
      else request = new MoneroSendRequest(requestOrAccountIndex, address, amount, priority);
    }
    if (request.getCanSplit() !== undefined) assert.equal(request.getCanSplit(), false, "Cannot request split transactions with send() which prevents splitting; use sendSplit() instead");
    
    // copy request and specify splitting
    request = request.copy().setCanSplit(false);
    
    // call common send function
    return await this.sendSplit(request);
  }
  
  /**
   * Create and relay one or more transactions to transfer funds from this
   * wallet according to the given request.
   *  
   * @param {MoneroSendRequest|json|uint} requestOrAccountIndex is a send request as an object or json or a source account index
   * @param {string} address is a destination address to send to (required iff no request given)
   * @param {BigInteger} sendAmount is the amount to send (required iff no request given)
   * @return {MoneroTxSet} a tx set with the requested transactions
   */
  async sendSplit(requestOrAccountIndex, address, amount, priority) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Sweep an output with a given key image.
   * 
   * @param {(MoneroSendRequest|string)} requestOrAddress is a send request or destination address
   * @param {string} keyImage is the key image hex of the output to sweep
   * @param {int} priority sets a transaction priority as an integer between 0 and 3 (see) {MoneroSendPriority})
   * @return {MoneroTxSet} a tx set with the requested transaction
   */
  async sweepOutput(requestOrAddress, keyImage, priority) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Sweep a subaddress's unlocked funds to an address.
   * 
   * @param {int} accountIdx is the index of the account
   * @param {int} subaddressIdx is the index of the subaddress
   * @param {string} address is the address to sweep the subaddress's funds to
   * @return {MoneroTxSet} a tx set with the requested transactions if possible
   */
  async sweepSubaddress(accountIdx, subaddressIdx, address) {
    let request = new MoneroSendRequest(address);
    request.setAccountIndex(accountIdx);
    request.setSubaddressIndices([subaddressIdx]);
    let txSets = await this.sweepUnlocked(request);
    return txSets[0];
  }
  
  /**
   * Sweep an acount's unlocked funds to an address.
   * 
   * @param {int} accountIdx is the index of the account
   * @param {string} address is the address to sweep the account's funds to
   * @return {MoneroTxSet} a tx set with the requested transactions if possible
   */
  async sweepAccount(accountIdx, address) {
    let request = new MoneroSendRequest(address);
    request.setAccountIndex(accountIdx);
    let txSets = await this.sweepUnlocked(request);
    return txSets[0]
  }
  
  /**
   * Sweep the wallet's unlocked funds to an address.
   * 
   * @param {string} address is the address to sweep the wallet's funds to
   * @return {MoneroTxSet[]} the tx sets with the transactions which sweep the wallet
   */
  async sweepWallet(address) {
    return await this.sweepUnlocked(new MoneroSendRequest(address));
  }

  /**
   * Sweep all unlocked funds according to the given request.
   * 
   * @param {MoneroSendRequest} request is the sweep configuration
   * @return {MoneroTxSet[]} the tx sets with the requested transactions
   */
  async sweepUnlocked(request) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
   * 
   * NOTE: Dust only exists pre RCT, so this method will throw "no dust to sweep" on new wallets.
   * 
   * @return {MoneroTxSet} a tx set with the requested transactions if possible
   */
  async sweepDust() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
   * 
   * @param {boolean} doNotRelay specifies if the resulting transaction should not be relayed (defaults to false i.e. relayed)
   * @return {MoneroTxSet} a tx set with the requested transactions if possible
   */
  async sweepDust(doNotRelay) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Parses a tx set containing unsigned or multisig tx hex to a new tx set containing structured transactions.
   * 
   * @param txSet is a tx set containing unsigned or multisig tx hex
   * @return {MoneroTxSet} the parsed tx set containing structured transactions
   */
  async parseTxSet(txSet) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Sign a message.
   * 
   * @param {string} msg is the message to sign
   * @return {string} the signature
   */
  async sign(message) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Verify a signature on a message.
   * 
   * @param {string} msg is the signed message
   * @param {string} address is the signing address
   * @param {string} signature is the signature
   * @return {boolean} true if the signature is good, false otherwise
   */
  async verify(message, address, signature) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a transaction's secret key from its hash.
   * 
   * @param {string} txHash is the transaction's hash
   * @return {string} is the transaction's secret key
   */
  async getTxKey(txHash) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Check a transaction in the blockchain with its secret key.
   * 
   * @param {string} txHash specifies the transaction to check
   * @param {string} txKey is the transaction's secret key
   * @param {string} address is the destination public address of the transaction
   * @return {MoneroCheckTx} the result of the check
   */
  async checkTxKey(txHash, txKey, address) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a transaction signature to prove it.
   * 
   * @param {string} txHash specifies the transaction to prove
   * @param {string} address is the destination public address of the transaction
   * @param {string} message is a message to include with the signature to further authenticate the proof (optional)
   * @return {string} the transaction signature
   */
  async getTxProof(txHash, address, message) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Prove a transaction by checking its signature.
   * 
   * @param {string} txHash specifies the transaction to prove
   * @param {string} address is the destination public address of the transaction
   * @param {string} message is a message included with the signature to further authenticate the proof (optional)
   * @param {string} signature is the transaction signature to confirm
   * @return {MoneroCheckTx} the result of the check
   */
  async checkTxProof(txHash, address, message, signature) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
   * 
   * @param {string} txHash specifies the transaction to prove
   * @param {string} message is a message to include with the signature to further authenticate the proof (optional)
   * @return {string} the transaction signature
   */
  async getSpendProof(txHash, message) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Prove a spend using a signature. Unlike proving a transaction, it does not require the destination public address.
   * 
   * @param {string} txHash specifies the transaction to prove
   * @param {string} message is a message included with the signature to further authenticate the proof (optional)
   * @param {string} signature is the transaction signature to confirm
   * @return {boolean} true if the signature is good, false otherwise
   */
  async checkSpendProof(txHash, message, signature) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Generate a signature to prove the entire balance of the wallet.
   * 
   * @param message is a message included with the signature to further authenticate the proof (optional)
   * @return the reserve proof signature
   */
  async getReserveProofWallet(message) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Generate a signature to prove an available amount in an account.
   * 
   * @param {int} accountIdx specifies the account to prove ownership of the amount
   * @param {BigInteger} amount is the minimum amount to prove as available in the account
   * @param {string} message is a message to include with the signature to further authenticate the proof (optional)
   * @return {string} the reserve proof signature
   */
  async getReserveProofAccount(accountIdx, amount, message) {
    throw new MoneroError("Subclass must implement");
  }

  /**
   * Proves a wallet has a disposable reserve using a signature.
   * 
   * @param {string} address is the public wallet address
   * @param {string} message is a message included with the signature to further authenticate the proof (optional)
   * @param {string} signature is the reserve proof signature to check
   * @return {MoneroCheckReserve} the result of checking the signature proof
   */
  async checkReserveProof(address, message, signature) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a transaction note.
   * 
   * @param {string} txHash specifies the transaction to get the note of
   * @return {string} the tx note
   */
  async getTxNote(txHash) {
    return (await this.getTxNotes([txHash]))[0];
  }
  
  /**
   * Get notes for multiple transactions.
   * 
   * @param {string[]} txHashes identify the transactions to get notes for
   * @return {string[]} notes for the transactions
   */
  async getTxNotes(txHashes) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Set a note for a specific transaction.
   * 
   * @param {string} txHash specifies the transaction
   * @param {string} note specifies the note
   */
  async setTxNote(txHash, note) {
    await this.setTxNotes([txHash], [note]);
  }
  
  /**
   * Set notes for multiple transactions.
   * 
   * @param {string[]} txHashes specify the transactions to set notes for
   * @param {string[]} notes are the notes to set for the transactions
   */
  async setTxNotes(txHashes, notes) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get all address book entries.
   * 
   * @return {MoneroAddressBookEntry[]} the address book entries
   */
  async getAddressBookEntries() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get address book entries.
   * 
   * @param {int[]} entryIndices are indices of the entries to get
   * @return {MoneroAddressBookEntry[]} the address book entries
   */
  async getAddressBookEntries(entryIndices) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Add an address book entry.
   * 
   * @param {string} address is the entry address
   * @param {string} description is the entry description (optional)
   * @return {int} the index of the added entry
   */
  async addAddressBookEntry(address, description) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Edit an address book entry.
   * 
   * @param index is the index of the address book entry to edit
   * @param setAddress specifies if the address should be updated
   * @param address is the updated address
   * @param setDescription specifies if the description should be updated
   * @param description is the updated description
   * @param setPaymentId specifies if the payment id should be updated
   * @param paymentId is the updated payment id
   */
  async editAddressBookEntry(index, setAddress, address, setDescription, description, setPaymentId, paymentId) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Add an address book entry.
   * 
   * @param {string} address is the entry address
   * @param {string} description is the entry description (optional)
   * @param {string} paymentId is the entry paymet id (optional)
   * @return {int} the index of the added entry
   */
  async addAddressBookEntry(address, description, paymentId) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Delete an address book entry.
   * 
   * @param {int} entryIdx is the index of the entry to delete
   */
  async deleteAddressBookEntry(entryIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Tag accounts.
   * 
   * @param {string} tag is the tag to apply to the specified accounts
   * @param {int[]} accountIndices are the indices of the accounts to tag
   */
  async tagAccounts(tag, accountIndices) {
    throw new MoneroError("Subclass must implement");
  }

  /**
   * Untag acconts.
   * 
   * @param {int[]}  accountIndices are the indices of the accounts to untag
   */
  async untagAccounts(accountIndices) {
    throw new MoneroError("Subclass must implement");
  }
  /**
   * Return all account tags.
   * 
   * @return {MoneroAccountTag[]} the wallet's account tags
   */
  async getAccountTags() {
    throw new MoneroError("Subclass must implement");
  }

  /**
   * Sets a human-readable description for a tag.
   * 
   * @param {string} tag is the tag to set a description for
   * @param {string} label is the label to set for the tag
   */
  async setAccountTagLabel(tag, label) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Creates a payment URI from a send configuration.
   * 
   * @param {MoneroSendRequest} request specifies configuration for a potential tx
   * @return {string} the payment uri
   */
  async createPaymentUri(request) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Parses a payment URI to a send request.
   * 
   * @param {string} uri is the payment uri to parse
   * @return {MoneroSendRequest} the send configuration parsed from the uri
   */
  async parsePaymentUri(uri) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get an attribute.
   * 
   * @param {string} key is the attribute to get the value of
   * @return {string} the attribute's value
   */
  async getAttribute(key) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Set an arbitrary attribute.
   * 
   * @param {string} key is the attribute key
   * @param {string} val is the attribute value
   */
  async setAttribute(key, val) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Start mining.
   * 
   * @param {int} numThreads is the number of threads created for mining (optional)
   * @param {boolean} backgroundMining specifies if mining should occur in the background (optional)
   * @param {boolean} ignoreBattery specifies if the battery should be ignored for mining (optional)
   */
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Stop mining.
   */
  async stopMining() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Indicates if importing multisig data is needed for returning a correct balance.
   * 
   * @return {boolean} true if importing multisig data is needed for returning a correct balance, false otherwise
   */
  async isMultisigImportNeeded() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Indicates if this wallet is a multisig wallet.
   * 
   * @return {boolean} true if this is a multisig wallet, false otherwise
   */
  async isMultisig() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get multisig info about this wallet.
   * 
   * @return {MoneroMultisigInfo} multisig info about this wallet
   */
  async getMultisigInfo() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get multisig info as hex to share with participants to begin creating a
   * multisig wallet.
   * 
   * @return {string} this wallet's multisig hex to share with participants
   */
  async prepareMultisig() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Make this wallet multisig by importing multisig hex from participants.
   * 
   * @param {String[]} multisigHexes are multisig hex from each participant
   * @param {int} threshold is the number of signatures needed to sign transfers
   * @param {string} password is the wallet password
   * @return {MoneroMultisigInitResult} the result which has the multisig's address xor this wallet's multisig hex to share with participants iff not N/N
   */
  async makeMultisig(multisigHexes, threshold, password) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Exchange multisig hex with participants in a M/N multisig wallet.
   * 
   * This process must be repeated with participants exactly N-M times.
   * 
   * @param {string[]} multisigHexes are multisig hex from each participant
   * @param {string} password is the wallet's password // TODO monero core: redundant? wallet is created with password
   * @return {MoneroMultisigInitResult} the result which has the multisig's address xor this wallet's multisig hex to share with participants iff not done
   */
  async exchangeMultisigKeys(multisigHexes, password) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Export this wallet's multisig info as hex for other participants.
   * 
   * @return {string} this wallet's multisig info as hex for other participants
   */
  async getMultisigHex() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Import multisig info as hex from other participants.
   * 
   * @param {string[]} multisigHexes are multisig hex from each participant
   * @return {int} the number of outputs signed with the given multisig hex
   */
  async importMultisigHex(multisigHexes) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Sign previously created multisig transactions as represented by hex.
   * 
   * @param {string} multisigTxHex is the hex shared among the multisig transactions when they were created
   * @return {MoneroMultisigSignResult} the result of signing the multisig transactions
   */
  async signMultisigTxHex(multisigTxHex) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Submit signed multisig transactions as represented by a hex string.
   * 
   * @param {string} signedMultisigTxHex is the signed multisig hex returned from signMultisigTxs()
   * @return {string[]} the resulting transaction hashes
   */
  async submitMultisigTxHex(signedMultisigTxHex) {
    throw new MoneroError("Subclass must implement");
  }

  /**
   * Save the wallet at its current path.
   */
  save() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Optionally save then close the wallet.
   *
   * @param {boolean} save specifies if the wallet should be saved before being closed (default false)
   */
  async close(save) {
    throw new MoneroError("Subclass must implement");
  }
  
  // -------------------------------- PRIVATE ---------------------------------
  
  static _normalizeSendRequest(requestOrAccountIndex, address, amount, priority) {
    if (requestOrAccountIndex === undefined) throw new MoneroError("First argument cannot be undefined");
    let request;
    if (requestOrAccountIndex instanceof MoneroSendRequest) {
      request = requestOrAccountIndex.copy();
    } else if (typeof requestOrAccountIndex === "number") {
      request = new MoneroSendRequest().setAccountIndex(requestOrAccountIndex).setAddress(address).setAmount(amount).setPriority(priority);
    } else {
      throw new MoneroException("First argument is invalid: " + requestOrAccountIndex);
    }
    return request;
  }
}

MoneroWallet.DEFAULT_LANGUAGE = "English";

module.exports = MoneroWallet;