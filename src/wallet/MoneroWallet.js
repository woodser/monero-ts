/**
 * MIT License
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

const MoneroTxRequest = require("./request/MoneroTxRequest");
const MoneroSendRequest = require("./request/MoneroSendRequest");
const MoneroError = require("../utils/MoneroError");

/**
 * Monero wallet interface and default implementations.
 */
class MoneroWallet {
  
  /**
   * Get the wallet's seed.
   * 
   * @return {string} is the wallet's seed
   */
  async getSeed() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's mnemonic phrase derived from the seed.
   * 
   * @return {string} is the wallet's mnemonic phrase
   */
  async getMnemonic() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a list of available languages for the wallet's mnemonic phrase.
   * 
   * @return {string[]} are the available languages for the wallet's mnemonic phrase
   */
  async getLanguages() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's public view key.
   * 
   * @return {string} is the wallet's public view key
   */
  async getPublicViewKey() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's private view key.
   * 
   * @return {string} is the wallet's private view key
   */
  async getPrivateViewKey() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's private spend key.
   * 
   * @return {string} is the wallet's private spend key
   */
  async getPrivateSpendKey() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the wallet's primary address.
   * 
   * @return {string} is the wallet's primary address
   */
  async getPrimaryAddress() {
    return await this.getAddress(0, 0);
  }
  
  /**
   * Get the address of a specific subaddress.
   * 
   * @param {int} accountIdx specifies the account index of the address's subaddress
   * @param {int} subaddressIdx specifies the subaddress index within the account
   * @return {string} is the receive address of the specified subaddress
   */
  async getAddress(accountIdx, subaddressIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the account and subaddress index of the given address.
   * 
   * @param address is the address to get the account and subaddress index from
   * @return {MoneroSubaddress} contains the indices or undefined
   * @throws {Error} if the address is not found
   */
  async getAddressIndex(address) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get an integrated address based on this wallet's primary address and the
   * given payment ID.  Generates a random payment ID if none is given.
   * 
   * @param {string} paymentId is the payment ID to generate an integrated address from (randomly generated if null)
   * @return {MoneroIntegratedAddress} is the integrated address
   */
  async getIntegratedAddress(paymentId) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Decode an integrated address to get its standard address and payment id.
   * 
   * @param {string} integratedAddress is an integrated address to decode
   * @return {MoneroIntegratedAddress} contains the standard address and payment id
   */
  async decodeIntegratedAddress(integratedAddress) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Synchronizes the wallet with the block chain.
   * 
   * @param {int} startHeight is the start height to sync from, syncs from the last synced block by default
   * @param {int} endHeight is the end height to sync to, syncs to the current chain height by default
   * @param {function} onProgress({percent: , message: , totalBlocks: , doneBlocks: }) is invoked as progress is made
   */
  async sync(startHeight, endHeight, onProgress) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Rescan the blockchain from scratch, losing any information which can not
   * be recovered from the blockchain itself.
   * 
   * WARNING: This method discards local wallet data like destination
   * addresses, tx secret keys, tx notes, etc.
   */
  async rescanBlockchain() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the height of the last block processed by the wallet (its index + 1).
   * 
   * @return {int} is the height of the last block processed by the wallet
   */
  async getHeight() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the blockchain's height.
   * 
   * @return {int} is the blockchain's height
   */
  async getChainHeight() {
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
   * Get the balance of the wallet, an account, or a subaddress.
   * 
   * @param {int} accountIdx specifies an account to get the balance of (optional)
   * @param {int} subaddressIdx specifies a subaddress to get the balance of (optional)
   * @return {BigInteger} is the balance
   */
  async getBalance(accountIdx, subaddressIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get the unlocked balance of the wallet, an account, or a subaddress.
   * 
   * @param {int} accountIdx specifies an account to get the unlocked balance of (optional)
   * @param {int} subaddressIdx specifies a subaddress to get the unlocked balance of (optional)
   * @return {BigInteger} is the unlocked balance
   */
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get accounts.
   * 
   * @param {boolean} includeSubaddresses specifies if subaddresses should be included (optional)
   * @return {MoneroAccount[]} are the retrieved accounts
   */
  async getAccounts(includeSubaddresses) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get an account.
   * 
   * @param {int} accountIdx specifies the account
   * @param {boolean} includeSubaddresses specifies if subaddresses should be included
   * @return {MoneroAccount} is the retrieved account
   */
  async getAccount(accountIdx, includeSubaddresses) {
    throw new MoneroError("Subclass must implement");
  }

  /**
   * Create a new account.
   * 
   * @param {string} label specifies the label for the account (optional)
   * @return {MoneroAccount} is the created account
   */
  async createAccount(label) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get subaddresses.
   * 
   * @param {int} accountIdx specifies the account to get subaddresses within
   * @param {(int|int[])} subaddressIndices are specific subaddresses to get (optional)
   * @return {MoneroSubaddress[]} are the retrieved subaddresses
   */
  async getSubaddresses(accountIdx, subaddressIndices) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a subaddress.
   * 
   * @param {int} accountIdx specifies the index of the subaddress's account
   * @param {int} subaddressIdx specifies index of the subaddress within the account
   * @return {MoneroSubaddress} is the retrieved subaddress
   */
  async getSubaddress(accountIdx, subaddressIdx) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Create a subaddress within an account.
   * 
   * @param {int} accountIdx specifies the index of the account to create the subaddress within
   * @param {string} label specifies the the label for the subaddress (optional)
   * @return {MoneroSubaddress} is the created subaddress
   */
  async createSubaddress(accountIdx, label) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a wallet transaction by id.
   * 
   * @param txId is an id of a transaction to get
   * @return MoneroTxWallet is the identified transactions
   */
  async getTx(txId) {
    return (await this.getTxs([txId]))[0];
  }
  
  /**
   * Get wallet transactions.  Wallet transactions contain one or more
   * transfers that are either incoming or outgoing to the wallet.
   * 
   * Query results can be filtered by passing in a transaction request.
   * Transactions must meet every criteria defined in the request in order to
   * be returned.  All filtering is optional and no filtering is applied when
   * not defined.
   * 
   * Transactions can be fetched by a MoneroTxRequest, equivalent js object, or
   * array of tx ids.
   * 
   * @param {(MoneroTxRequest|string[]|object)} config configures the query (optional)
   * @param {boolean} config.isConfirmed gets txs that are confirmed or not (optional)
   * @param {boolean} config.inTxPool get txs that are in the tx pool or not (optional)
   * @param {boolean} config.isRelayed gets txs that are relayed or not (optional)
   * @param {boolean} config.isFailed gets txs that are failed or not (optional)
   * @param {boolean} config.isCoinbase gets coinbase txs or not (optional)
   * @param {string} config.id gets a tx with the id (optional)
   * @param {string} config.txId gets a tx with the id (alias of id) (optional)
   * @param {string[]} config.txIds gets txs with the ids (optional)
   * @param {string} config.paymentId gets transactions with the payment id (optional)
   * @param {string[]} config.paymentIds gets transactions with the payment ids (optional)
   * @param {boolean} config.hasPaymentId gets transactions with a payment id or not (optional)
   * @param {int} config.minHeight gets txs with height >= the given height (optional)
   * @param {int} config.maxHeight gets txs with height <= the given height (optional)
   * @param {boolean} config.isOutgoing gets txs with an outgoing transfer or not (optional)
   * @param {boolean} config.isIncoming gets txs with an incoming transfer or not (optional)
   * @param {MoneroTransferRequest} config.transferRequest gets txs that have a transfer that meets this request (optional)
   * @param {boolean} config.includeOutputs specifies that tx vouts should be returned with tx results (optional)
   * @return {MoneroTxWallet[]} are wallet transactions per the configuration
   */
  async getTxs(config) {
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
   * @param {(MoneroTransferRequest|object)} config configures the query (optional)
   * @param {boolean} config.isOutgoing gets transfers that are outgoing or not (optional)
   * @param {boolean} config.isIncoming gets transfers that are incoming or not (optional)
   * @param {string} config.address is the wallet's address that a transfer either originated from (if outgoing) or is destined for (if incoming) (optional)
   * @param {int} config.accountIndex gets transfers that either originated from (if outgoing) or are destined for (if incoming) a specific account index (optional)
   * @param {int} config.subaddressIndex gets transfers that either originated from (if outgoing) or are destined for (if incoming) a specific subaddress index (optional)
   * @param {int[]} config.subaddressIndices gets transfers that either originated from (if outgoing) or are destined for (if incoming) specific subaddress indices (optional)
   * @param {BigInteger} config.amount is the amount being transferred (optional)
   * @param {MoneroDestination[]} config.destinations are individual destinations of an outgoing transfer, which is local wallet data and NOT recoverable from the blockchain (optional)
   * @param {boolean} config.hasDestinations gets transfers that have destinations or not (optional)
   * @param {MoneroTxRequest} config.txRequest gets transfers whose transaction meets this request (optional)
   * @return {MoneroTransfer[]} are wallet transfers per the configuration
   */
  async getTransfers(config) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get outputs created from previous transactions that belong to the wallet
   * (i.e. that the wallet can spend one time).  Outputs are part of
   * transactions which are stored in blocks on the blockchain.
   * 
   * Results can be configured by passing a MoneroOutputRequest.  Outputs must
   * meet every criteria defined in the request in order to be returned.  All
   * filtering is optional and no filtering is applied when not defined.
   * 
   * TODO: add additional filtering in MoneroOutputRequest.js meetsCriteria()
   * 
   * @param {(MoneroOutputRequest|object)} config configures the query (optional)
   * @param {int} config.accountIndex gets outputs associated with a specific account index
   * @param {int} config.subaddressIndex gets outputs associated with a specific subaddress index
   * @param {int[]} config.subaddressIndices gets outputs associated with specific subaddress indices
   * @param {BigInteger} config.amount gets outputs with a specific amount
   * @param {boolean} config.isSpent gets outputs that are spent or not
   * @param {MoneroKeyImage} config.keyImage is a key image whose defined fields filter outputs to get
   * @param {MoneroTxRequest} config.txRequest gets outputs whose transaction meets this filter (optional)
   * @return {MoneroOutputWallet[]} are wallet outputs per the configuration
   */
  async getOutputs(config) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Export all outputs in hex format.
   * 
   * @return {string} are all outputs in hex format, undefined if no outputs
   */
  async getOutputsHex() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Import outputs in hex format.
   * 
   * @param {string} outputsHex are outputs in hex format
   * @return {int} is the number of outputs imported
   */
  async importOutputsHex(outputsHex) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get all signed key images.
   * 
   * @return {MoneroKeyImage[]} are the wallet's signed key images
   */
  async getKeyImages() {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Import signed key images and verify their spent status.
   * 
   * @param {MoneroKeyImage[]} keyImages are key images to import and verify (requires hex and signature)
   * @return {MoneroKeyImageImportResult} contains results of the import
   */
  async importKeyImages(keyImages) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get new key images from the last imported outputs.
   * 
   * @return {MoneroKeyImage[]} are the key images from the last imported outputs
   */
  async getNewKeyImagesFromLastImport() {
    throw new MoneroError("Subclass must implement");
  }

  /**
   * Create a transaction which transfers funds from this wallet to one or more destinations.
   * 
   * @param {MoneroSendRequest|json|uint} requestOrAccountIndex is a send request as an object or json or a source account index
   * @param {string} address is a destination address to send to (required iff no request given)
   * @param {BigInteger} sendAmount is the amount to send (required iff no request given)
   */
  async send(requestOrAccountIndex, address, amount, priority) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Create one or more transactions which transfers funds from this wallet to one or more destinations.
   * 
   * @param {MoneroSendRequest|json|uint} requestOrAccountIndex is a send request as an object or json or a source account index
   * @param {string} address is a destination address to send to (required iff no request given)
   * @param {BigInteger} sendAmount is the amount to send (required iff no request given)
   */
  async send(requestOrAccountIndex, address, amount, priority) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Sweep an output with a given key image.
   * 
   * @param {(MoneroSendRequest|string)} requestOrAddress is a send request or destination address
   * @param {string} keyImage is the key image hex of the output to sweep
   * @param {int} priority sets a transaction priority as an integer between 0 and 3 (see {MoneroSendPriority})
   * @return {MoneroTxWallet} is the resulting transaction from sweeping an output 
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
   * @return {MoneroTxWallet[]} are the resulting transactions
   */
  async sweepSubaddress(accountIdx, subaddressIdx, address) {
    let request = new MoneroSendRequest(address);
    request.setAccountIndex(accountIdx);
    request.setSubaddressIndices([subaddressIdx]);
    return this.sweepAllUnlocked(request);
  }
  
  /**
   * Sweep an acount's unlocked funds to an address.
   * 
   * @param {int} accountIdx is the index of the account
   * @param {address} address is the address to sweep the account's funds to
   * @return {MoneroTxWallet[]} are the resulting transactions
   */
  async sweepAccount(accountIdx, address) {
    let request = new MoneroSendRequest(address);
    request.setAccountIndex(accountIdx);
    return this.sweepAllUnlocked(request);
  }
  
  /**
   * Sweep the wallet's unlocked funds to an address.
   * 
   * @param {string} address is the address to sweep the wallet's funds to
   * @return {MoneroTxWallet[]} are the resulting transactions
   */
  async sweepWallet(address) {
    return this.sweepAllUnlocked(new MoneroSendRequest(address));
  }

  /**
   * Sweep all unlocked funds according to the given request.
   * 
   * @param {(MoneroSendRequest|object)} config is the sweep configuration
   * @return {MoneroTxWallet[]} are the resulting transactions
   */
  async sweepAllUnlocked(config) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
   * 
   * @param {boolean} doNotRelay specifies if the resulting transaction should not be relayed (defaults to false i.e. relayed)
   * @return {MoneroTxWallet[]} are the resulting transactions from sweeping dust
   */
  async sweepDust(doNotRelay) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Relay a transaction previously created without relaying.
   * 
   * @param {string} txMetadata is transaction metadata previously created without relaying
   * @return {String} is the id of the relayed tx
   */
  async relayTx(txMetadata) {
    return (await this.relayTxs([txMetadata]))[0];
  }
  
  /**
   * Relay transactions previously created without relaying.
   * 
   * @param {string[]} txMetadatas are transaction metadata previously created without relaying
   * @return {String[]} are the ids of the relayed txs
   */
  async relayTxs(txMetadatas) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a transaction note.
   * 
   * @param {string} txId specifies the transaction to get the note of
   * @return {string} is the tx note
   */
  async getTxNote(txId) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Set a note for a specific transaction.
   * 
   * @param {string} txId specifies the transaction
   * @param {string} note specifies the note
   */
  async setTxNote(txId, note) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get notes for multiple transactions.
   * 
   * @param {string[]} txIds identify the transactions to get notes for
   * @preturns {string[]} are notes for the transactions
   */
  async getTxNotes(txIds) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Set notes for multiple transactions.
   * 
   * @param {string[]} txIds specify the transactions to set notes for
   * @param {string[]} notes are the notes to set for the transactions
   */
  async setTxNotes(txIds, notes) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Sign a message.
   * 
   * @param {string} msg is the message to sign
   * @return {string} is the signature
   */
  async sign(msg) {
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
  async verify(msg, address, signature) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a transaction's secret key from its id.
   * 
   * @param {string} txId is the transaction's id
   * @return {string} is the transaction's secret key
   */
  async getTxKey(txId) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Check a transaction in the blockchain with its secret key.
   * 
   * @param {string} txId specifies the transaction to check
   * @param {string} txKey is the transaction's secret key
   * @param {string} address is the destination public address of the transaction
   * @return {MoneroCheckTx} is the result of the check
   */
  async checkTxKey(txId, txKey, address) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get a transaction signature to prove it.
   * 
   * @param {string} txId specifies the transaction to prove
   * @param {string} address is the destination public address of the transaction
   * @param {string} message is a message to include with the signature to further authenticate the proof (optional)
   * @return {string} is the transaction signature
   */
  async getTxProof(txId, address, message) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Prove a transaction by checking its signature.
   * 
   * @param {string} txId specifies the transaction to prove
   * @param {string} address is the destination public address of the transaction
   * @param {string} message is a message included with the signature to further authenticate the proof (optional)
   * @param {string} signature is the transaction signature to confirm
   * @return {MoneroCheckTx} is the result of the check
   */
  async checkTxProof(txId, address, message, signature) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
   * 
   * @param {string} txId specifies the transaction to prove
   * @param {string} message is a message to include with the signature to further authenticate the proof (optional)
   * @return {string} is the transaction signature
   */
  async getSpendProof(txId, message) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Prove a spend using a signature. Unlike proving a transaction, it does not require the destination public address.
   * 
   * @param {string} txId specifies the transaction to prove
   * @param {string} message is a message included with the signature to further authenticate the proof (optional)
   * @param {string} signature is the transaction signature to confirm
   * @return {boolean} true if the signature is good, false otherwise
   */
  async checkSpendProof(txId, message, signature) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Generate a signature to prove the entire balance of the wallet.
   * 
   * @param {string} message is a message included with the signature to further authenticate the proof (optional)
   * @return {string} is the reserve proof signature
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
   * @return {string} is the reserve proof signature
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
   * @return {MoneroCheckReserve} is the result of checking the signature proof
   */
  async checkReserveProof(address, message, signature) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Get address book entries.
   * 
   * @param {int[]} entryIndices are indices of the entries to get
   * @return {MoneroAddressBookEntry[]} are the address book entries
   */
  async getAddressBookEntries(entryIndices) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Add an address book entry.
   * 
   * @param {string} address is the entry address
   * @param {string} description is the entry description (optional)
   * @param {string} paymentId is the entry paymet id (optional)
   * @return {int} is the index of the added entry
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
   * @param {int[]} accountIndices are the indices of the accounts to untag
   */
  async untagAccounts(accountIndices) {
    throw new MoneroError("Subclass must implement");
  }

  /**
   * Return all account tags.
   * 
   * @return {MoneroAccountTag[]} are the wallet's account tags
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
   * @return {string} is the payment uri
   */
  async createPaymentUri(request) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Parses a payment URI to a send configuration.
   * 
   * @param {string} uri is the payment uri to parse
   * @return {MoneroSendRequest} is the send configuration parsed from the uri
   */
  async parsePaymentUri(uri) {
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
   * Get an attribute.
   * 
   * @param {string} key is the attribute to get the value of
   * @return {string} is the attribute's value
   */
  async getAttribute(key) {
    throw new MoneroError("Subclass must implement");
  }
  
  /**
   * Start mining.
   * 
   * @param {int} numThreads is the number of threads created for mining
   * @param {boolean} backgroundMining specifies if mining should occur in the background
   * @param {boolean} ignoreBattery specifies if the battery should be ignored for mining
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
}

module.exports = MoneroWallet;