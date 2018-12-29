const MoneroSendConfig = require('./model/MoneroSendConfig');

/**
 * Monero wallet interface and default implementations.
 *
 * TODO: add {type} brackets to params
 */
class MoneroWallet {
  
  /**
   * Get the wallet's seed.
   * 
   * @returns string is the wallet's seed
   */
  async getSeed() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the wallet's mnemonic phrase derived from the seed.
   * 
   * @returns string is the wallet's mnemonic phrase
   */
  async getMnemonic() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the wallet's public view key.
   * 
   * @returns string is the wallet's public view key
   */
  async getPublicViewKey() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the wallet's private view key.
   * 
   * @returns string is the wallet's private view key
   */
  async getPrivateViewKey() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the height of the last block processed by the wallet (its index + 1).
   * 
   * @returns {number} is the height of the last block processed by the wallet
   */
  async getHeight() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the blockchain's height.
   * 
   * @returns number is the block chain's height
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
   * @returns MoneroIntegratedAddress is the integrated address
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
   * @returns true if importing multisig data is needed for returning a correct balance, false otherwise
   */
  async isMultisigImportNeeded() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the balance across all accounts.
   * 
   * @returns number is the balance across all accounts
   */
  async getBalance() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the unlocked balance across all accounts.
   * 
   * @returns number is the unlocked balance across all accounts
   */
  async getUnlockedBalance() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get accounts.
   * 
   * @param includeSubaddresses specifies if subaddresses should be included (optional)
   * @param tag specifies a filtering tag (optional)
   * @returns MoneroAccount[] are the retrieved accounts
   */
  async getAccounts(includeSubaddresses, tag) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get an account.
   * 
   * @param accountIdx specifies the account
   * @param includeSubaddresses specifies if subaddresses should be included
   * @returns MoneroAccount is the retrieved account
   */
  async getAccount(accountIdx, includeSubaddresses) {
    throw new Error("Subclass must implement");
  }

  /**
   * Create a new account.
   * 
   * @param label specifies the label for the account (optional)
   * @returns MoneroAccount is the created account
   */
  async createAccount(label) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get subaddresses.
   * 
   * @param accountIdx specifies the account to get subaddresses within
   * @param subaddressIndices is a number or numbers which specify subaddresses within the account (optional)
   * @returns {MoneroSubaddress[]} are the retrieved subaddresses
   */
  async getSubaddresses(accountIdx, subaddressIndices) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a subaddress.
   * 
   * @param accountIdx specifies the index of the subaddress's account
   * @param subaddressIdx specifies index of the subaddress within the account
   * @returns MoneroSubaddress is the retrieved subaddress
   */
  async getSubaddress(accountIdx, subaddressIdx) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Create a subaddress within an account.
   * 
   * @param accountIdx specifies the index of the account to create the subaddress within
   * @param label specifies the the label for the subaddress (optional)
   * @returns MoneroSubaddress is the created subaddress
   */
  async createSubaddress(accountIdx, label) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the address of a specified subaddress.
   * 
   * @param accountIdx specifies the account index of the address's subaddress
   * @param subaddressIdx specifies the subaddress index within the account
   * @returns string is the receive address of the specified subaddress
   */
  async getAddress(accountIdx, subaddressIdx) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get wallet transactions.
   * 
   * @param {MoneroTxFilter} or {number} returns transactions that meet the
   *        filter or transactions to/from the account index (defaults to all)
   * @param {number} returns transactions to/from this subaddress within the 
   *        given account (defaults to all)
   */
  async getTxs(filterOrAccountIdx, subaddressIdx) {
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
   * @return {MoneroTxWallet[]} are the resulting transactions
   */
  async sweepWallet(address) {
    return await this.sweep(new MoneroSendConfig(address));
  }

  /**
   * Sweep an acount's unlocked funds to an address.
   * 
   * @param accountIdx is the index of the account
   * @param address is the address to sweep the account's funds to
   * @return {MoneroTxWallet[]} are the resulting transactions
   */
  async sweepAccount(accountIdx, address) {
    let config = new MoneroSendConfig(address);
    config.setAccountIndex(accountIdx);
    return await this.sweep(config);
  }

  /**
   * Sweep a subaddress's unlocked funds to an address.
   * 
   * @param accountIdx is the index of the account
   * @param subaddressIdx is the index of the subaddress
   * @param address is the address to sweep the subaddress's funds to
   * @return {MoneroTxWallet[]} are the resulting transactions
   */
  async sweepSubaddress(accountIdx, subaddressIdx, address) {
    let config = new MoneroSendConfig(address);
    config.setAccountIndex(accountIdx);
    config.setSubaddressIndices([subaddressIdx]);
    return await this.sweep(config);
  }

  /**
   * Sweep unlocked funds.
   * 
   * @param config specifies the sweep configuration
   * @param {MoneroTxWallet[]} are the resulting transactions
   */
  async sweep(config) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.
   * 
   * @param doNotRelay specifies if the resulting transaction should not be relayed (defaults to false i.e. relayed)
   * @return {MoneroTxWallet[]} are the resulting transactions from sweeping dust
   */
  async sweepDust(doNotRelay) {
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
   * @returns {string} is the tx note
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
   * Get a transaction's secret key from its id.
   * 
   * @param txId is the transaction's id
   * @returns {string} is the transaction's secret key
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
   * @returns {MoneroCheckTx} is the result of the check
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
   * @returns {string} is the transaction signature
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
   * @returns {MoneroCheckTx} is the result of the check
   */
  async checkTxProof(txId, address, message, signature) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
   * 
   * @param txId specifies the transaction to prove
   * @param message is a message to include with the signature to further authenticate the proof (optional)
   * @returns {string} is the transaction signature
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
   * @returns {boolean} true if the signature is good, false otherwise
   */
  async checkSpendProof(txId, message, signature) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Generate a signature to prove the entire balance of the wallet.
   * 
   * @param message is a message included with the signature to further authenticate the proof (optional)
   * @returns {string} is the reserve proof signature
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
   * @returns {string} is the reserve proof signature
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
   * @returns {MoneroCheckReserve} is the result of checking the signature proof
   */
  async checkReserveProof(address, message, signature) {
    throw new Error("Subclass must implement");
  }
}

module.exports = MoneroWallet;