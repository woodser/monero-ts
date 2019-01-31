const MoneroTxFilter = require("./filters/MoneroTxFilter");
const MoneroSendConfig = require("./model/MoneroSendConfig");

/**
 * Monero wallet interface and default implementations.
 *
 * TODO: add {type} brackets to params
 */
class MoneroWallet {
  
  /**
   * Get the wallet's seed.
   * 
   * @return string is the wallet's seed
   */
  async getSeed() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the wallet's mnemonic phrase derived from the seed.
   * 
   * @return string is the wallet's mnemonic phrase
   */
  async getMnemonic() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the wallet's public view key.
   * 
   * @return string is the wallet's public view key
   */
  async getPublicViewKey() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the wallet's private view key.
   * 
   * @return string is the wallet's private view key
   */
  async getPrivateViewKey() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the height of the last block processed by the wallet (its index + 1).
   * 
   * @return {number} is the height of the last block processed by the wallet
   */
  async getHeight() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the blockchain's height.
   * 
   * @return number is the block chain's height
   */
  async getChainHeight() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the wallet's primary address.
   * 
   * @return string is the wallet's primary address
   */
  async getPrimaryAddress() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get an integrated address based on this wallet's primary address and the
   * given payment ID.  Generates a random payment ID if none is given.
   * 
   * @param paymentId is the payment ID to generate an integrated address from (randomly generated if null)
   * @return MoneroIntegratedAddress is the integrated address
   */
  async getIntegratedAddress(paymentId) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Synchronizes the wallet with the block chain.
   * 
   * @param startHeight is the start height to sync from, syncs from the last synced block by default
   * @param endHeight is the end height to sync to, syncs to the current chain height by default
   * @param onProgress({percent: _, message: _, totalBlocks: _, doneBlocks: _}) is invoked as progress is made
   */
  async sync(startHeight, endHeight, onProgress) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Indicates if importing multisig data is needed for returning a correct balance.
   * 
   * @return true if importing multisig data is needed for returning a correct balance, false otherwise
   */
  async isMultisigImportNeeded() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get accounts.
   * 
   * @param includeSubaddresses specifies if subaddresses should be included (optional)
   * @return MoneroAccount[] are the retrieved accounts
   */
  async getAccounts(includeSubaddresses) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get an account.
   * 
   * @param accountIdx specifies the account
   * @param includeSubaddresses specifies if subaddresses should be included
   * @return MoneroAccount is the retrieved account
   */
  async getAccount(accountIdx, includeSubaddresses) {
    throw new Error("Subclass must implement");
  }

  /**
   * Create a new account.
   * 
   * @param label specifies the label for the account (optional)
   * @return MoneroAccount is the created account
   */
  async createAccount(label) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get subaddresses.
   * 
   * @param accountIdx specifies the account to get subaddresses within
   * @param subaddressIndices is a number or numbers which specify subaddresses within the account (optional)
   * @return {MoneroSubaddress[]} are the retrieved subaddresses
   */
  async getSubaddresses(accountIdx, subaddressIndices) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a subaddress.
   * 
   * @param accountIdx specifies the index of the subaddress's account
   * @param subaddressIdx specifies index of the subaddress within the account
   * @return MoneroSubaddress is the retrieved subaddress
   */
  async getSubaddress(accountIdx, subaddressIdx) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Create a subaddress within an account.
   * 
   * @param accountIdx specifies the index of the account to create the subaddress within
   * @param label specifies the the label for the subaddress (optional)
   * @return MoneroSubaddress is the created subaddress
   */
  async createSubaddress(accountIdx, label) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the address of a specified subaddress.
   * 
   * @param accountIdx specifies the account index of the address's subaddress
   * @param subaddressIdx specifies the subaddress index within the account
   * @return string is the receive address of the specified subaddress
   */
  async getAddress(accountIdx, subaddressIdx) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the account and subaddress index of the given address.
   * 
   * TODO: test and with unfound address
   * 
   * @param address is the address to get the account and subaddress index from
   * @return {MoneroSubaddress} contains the indices or undefined if not found
   */
  async getAddressIndex(address) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the balance of the wallet, an account, or a subaddress.
   * 
   * @param {int} accountIdx specifies an account to get the balance of (optional)
   * @param {int} subaddressIdx specifies a subaddress to get the balance of (optional)
   * @return {BigInteger} is the balance
   */
  async getBalance(accountIdx, subaddressIdx) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the unlocked balance of the wallet, an account, or a subaddress.
   * 
   * @param {int} accountIdx specifies an account to get the unlocked balance of (optional)
   * @param {int} subaddressIdx specifies a subaddress to get the unlocked balance of (optional)
   * @return {BigInteger} is the unlocked balance
   */
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get wallet transactions.
   * 
   * @param config configures transactions to get
   *        config.isConfirmed
   *        config.inTxPool
   *        config.isRelayed
   *        config.isFailed
   *        config.txId
   *        config.txIds
   *        config.paymentIds
   *        config.hasOutgoingTransfer
   *        config.hasIncomingTransfer
   *        config.hasDestinations
   *        config.minHeight
   *        config.maxHeight
   *        config.transferFilter
   *        config.getVouts specifies that vouts should be returned with the transactions
   * @return {MoneroWalletTx[]} are the retrieved transactions
   */
  async getTxs(config) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get incoming and/or outgoing transfers from wallet transactions.
   * 
   * @param config configures transfers to get
   *        config.accountIndex
   *        config.subaddressIndices
   *        config.isOutgoing
   *        config.isIncoming
   *        config.isConfirmed
   *        config.inTxPool
   *        config.isRelayed
   *        config.isFailed
   *        config.txId
   *        config.txIds
   *        config.paymentIds
   *        config.hasOutgoingTransfer
   *        config.hasIncomingTransfer
   *        config.hasDestinations
   *        config.minHeight
   *        config.maxHeight
   * @return {MoneroWalletTransfer[]} are the retrieved transfers
   */
  async getTransfers(config) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get vouts which are outputs that belong to the wallet created from
   * previous transactions.
   * 
   * @param config configures vouts to get
   *        config.accountIndex
   *        config.subaddressIndices
   *        config.minHeight
   *        config.maxHeight
   * @return {MoneroWalletOutput[]} are the retrieved vouts
   */
  async getVouts(config) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * TODO.
   */
  async getKeyImages() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * TODO.
   */
  async importKeyImages() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * TODO.
   */
  async send(configOrAddress, sendAmount, paymentId, priority, mixin) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * TODO.
   */
  async sendSplit(configOrAddress, sendAmount, paymentId, priority, mixin) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Sweep the wallet's unlocked funds to an address.
   * 
   * @param address is the address to sweep the wallet's funds to
   * @return {MoneroWalletTx[]} are the resulting transactions
   */
  async sweepWallet(address) {
    return await this.sweepUnlocked(new MoneroSendConfig(address));
  }

  /**
   * Sweep an acount's unlocked funds to an address.
   * 
   * @param accountIdx is the index of the account
   * @param address is the address to sweep the account's funds to
   * @return {MoneroWalletTx[]} are the resulting transactions
   */
  async sweepAccount(accountIdx, address) {
    let config = new MoneroSendConfig(address);
    config.setAccountIndex(accountIdx);
    return await this.sweepUnlocked(config);
  }

  /**
   * Sweep a subaddress's unlocked funds to an address.
   * 
   * @param accountIdx is the index of the account
   * @param subaddressIdx is the index of the subaddress
   * @param address is the address to sweep the subaddress's funds to
   * @return {MoneroWalletTx[]} are the resulting transactions
   */
  async sweepSubaddress(accountIdx, subaddressIdx, address) {
    let config = new MoneroSendConfig(address);
    config.setAccountIndex(accountIdx);
    config.setSubaddressIndices([subaddressIdx]);
    return await this.sweepUnlocked(config);
  }

  /**
   * Sweep unlocked funds.
   * 
   * @param config specifies the sweep configuration
   * @return {MoneroWalletTx[]} are the resulting transactions
   */
  async sweepUnlocked(config) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
   * 
   * @param doNotRelay specifies if the resulting transaction should not be relayed (defaults to false i.e. relayed)
   * @return {MoneroWalletTx[]} are the resulting transactions from sweeping dust
   */
  async sweepDust(doNotRelay) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Sweep an output with a given key image.
   * 
   * @param {MoneroSendConfig|string} is a send configuration or destination address
   * @param {string} keyImage is the key image hex of the output to sweep
   * @param {int} priority sets a transaction priority as an integer between 0 and 3 (see {MoneroSendPriority})
   * @param {int} mixin is the number of outputs from the blockchain to mix with (default 11)
   * @return {MoneroWalletTx} is the resulting transaction from sweeping an output 
   */
  async sweepOutput(configOrAddress, keyImage, priority, mixin) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Relays tranactions previously created without relaying.
   * 
   * @param txs are the transactions to relay
   * @return {MoneroTx[]} are the relayed txs
   */
  async relayTxs(txs) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Start mining.
   * 
   * @param numThreads is the number of threads created for mining
   * @param backgroundMining specifies if mining should occur in the background
   * @param ignoreBattery specifies if the battery should be ignored for mining
   */
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Stop mining.
   */
  async stopMining() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a transaction note.
   * 
   * @param txId specifies the transaction to get the note of
   * @return {string} is the tx note
   */
  async getTxNote(txId) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Set a note for a specific transaction.
   * 
   * @param txId specifies the transaction
   * @param note specifies the note
   */
  async setTxNote(txId, note) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get notes for multiple transactions.
   * 
   * @param txIds identify the transactions to get notes for
   * @preturns {string[]} are notes for the transactions
   */
  async getTxNotes(txIds) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Set notes for multiple transactions.
   * 
   * @param txIds specify the transactions to set notes for
   * @param notes are the notes to set for the transactions
   */
  async setTxNotes(txIds, notes) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Sign a message.
   * 
   * @param {string} msg is the message to sign
   * @return {string} is the signature
   */
  async sign(msg) {
    throw new Error("Subclass must implement");
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
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a transaction's secret key from its id.
   * 
   * @param txId is the transaction's id
   * @return {string} is the transaction's secret key
   */
  async getTxKey(txId) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Check a transaction in the blockchain with its secret key.
   * 
   * @param txId specifies the transaction to check
   * @param txKey is the transaction's secret key
   * @param address is the destination public address of the transaction
   * @return {MoneroCheckTx} is the result of the check
   */
  async checkTxKey(txId, txKey, address) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a transaction signature to prove it.
   * 
   * @param txId specifies the transaction to prove
   * @param address is the destination public address of the transaction
   * @param message is a message to include with the signature to further authenticate the proof (optional)
   * @return {string} is the transaction signature
   */
  async getTxProof(txId, address, message) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Prove a transaction by checking its signature.
   * 
   * @param txId specifies the transaction to prove
   * @param address is the destination public address of the transaction
   * @param message is a message included with the signature to further authenticate the proof (optional)
   * @param signature is the transaction signature to confirm
   * @return {MoneroCheckTx} is the result of the check
   */
  async checkTxProof(txId, address, message, signature) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
   * 
   * @param txId specifies the transaction to prove
   * @param message is a message to include with the signature to further authenticate the proof (optional)
   * @return {string} is the transaction signature
   */
  async getSpendProof(txId, message) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Prove a spend using a signature. Unlike proving a transaction, it does not require the destination public address.
   * 
   * @param txId specifies the transaction to prove
   * @param message is a message included with the signature to further authenticate the proof (optional)
   * @param signature is the transaction signature to confirm
   * @return {boolean} true if the signature is good, false otherwise
   */
  async checkSpendProof(txId, message, signature) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Generate a signature to prove the entire balance of the wallet.
   * 
   * @param message is a message included with the signature to further authenticate the proof (optional)
   * @return {string} is the reserve proof signature
   */
  async getWalletReserveProof(message) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Generate a signature to prove an available amount in an account.
   * 
   * @param accountIdx specifies the account to prove contains an available amount
   * @param amount is the minimum amount to prove as available in the account
   * @param message is a message to include with the signature to further authenticate the proof (optional)
   * @return {string} is the reserve proof signature
   */
  async getAccountReserveProof(accountIdx, amount, message) {
    throw new Error("Subclass must implement");
  }

  /**
   * Proves a wallet has a disposable reserve using a signature.
   * 
   * @param address is the public wallet address
   * @param message is a message included with the signature to further authenticate the proof (optional)
   * @param signature is the reserve proof signature to check
   * @return {MoneroCheckReserve} is the result of checking the signature proof
   */
  async checkReserveProof(address, message, signature) {
    throw new Error("Subclass must implement");
  }
  
  async getAddressBookEntries(entryIndices) {
    throw new Error("Subclass must implement");
  }
  
  async addAddressBookEntry(address, paymentId, description) {
    throw new Error("Subclass must implement");
  }
  
  async deleteAddressBookEntry(entryIdx) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Tags accounts.
   * 
   * @param tag is the tag to apply to the specified accounts
   * @param accountIndices are the indices of the accounts to tag
   */
  async tagAccounts(tag, accountIndices) {
    throw new Error("Subclass must implement");
  }

  /**
   * Untags acconts.
   * 
   * @param accountIndices are the indices of the accounts to untag
   */
  async untagAccounts(accountIndices) {
    throw new Error("Subclass must implement");
  }

  /**
   * Returns all account tags.
   * 
   * @return {MoneroAccountTag[]} are the wallet's account tags
   */
  async getAccountTags() {
    throw new Error("Subclass must implement");
  }

  /**
   * Sets a human-readable description for a tag.
   * 
   * @param tag is the tag to set a description for
   * @param label is the label to set for the tag
   */
  async setAccountTagLabel(tag, label) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Creates a payment URI from a send configuration.
   * 
   * @param {MoneroSendConfig} sendConfig specifies configuration for a potential tx
   * @return {string} is the payment uri
   */
  async createPaymentUri(sendConfig) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Parses a payment URI to a send configuration.
   * 
   * @param {string} uri is the payment uri to parse
   * @return {MoneroSendConfig} is the send configuration parsed from the uri
   */
  async parsePaymentUri(uri) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Export all outputs in hex format.
   * 
   * @return {string} are all outputs in hex format, undefined if no outputs
   */
  async getOutputsHex() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Import outputs in hex format.
   * 
   * @param {string} outputsHex are outputs in hex format
   * @return {number} is the number of outputs imported
   */
  async importOutputsHex(outputsHex) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get all signed key images.
   * 
   * @return {TODO[]} are the signed key images
   */
  async getKeyImages() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get new key images from the last imported outputs (and key images? TODO).
   */
  async getNewKeyImagesFromLastImport() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Import signed key images and verify their spent status.
   * 
   * @param {TODO[]} keyImages are the key images to import and verify
   * @return {TODO} includes height and amount spent/unspent from the images
   */
  async importKeyImages(keyImages) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Set an arbitrary attribute.
   * 
   * @param key is the attribute key
   * @param val is the attribute value
   */
  async setAttribute(key, val) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get an attribute.
   * 
   * @param key is the attribute to get the value of
   * @return {string} is the attribute's value
   */
  async getAttribute(key) {
    throw new Error("Subclass must implement");
  }
}

module.exports = MoneroWallet;