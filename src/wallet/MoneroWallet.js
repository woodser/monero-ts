/**
 * Monero wallet interface and default implementations.
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
   * Get the wallet's height.
   * 
   * @returns string is the wallet's height
   */
  async getHeight() {
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
   * TODO.
   */
  async refresh(onProgress) {
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
   * @param accountIdx specifies the account to get subaddresses of
   * @param subaddressIndices specifies subaddresses within the account (optional)
   * @returns MoneroSubaddress[] are the retrieved subaddresses
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
   * Indicates if importing multisig data is needed for returning a correct balance.
   * 
   * @returns true if importing multisig data is needed for returning a correct balance, false otherwise
   */
  async isMultisigImportNeeded() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * TODO.
   */
  async getTxs() {
    throw new Error("Subclass must implement");
  }
}

module.exports = MoneroWallet;