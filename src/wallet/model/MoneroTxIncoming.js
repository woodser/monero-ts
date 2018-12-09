
/**
 * Models an incoming transaction to the wallet.
 */
class MoneroTxIncoming extends MoneroTxWallet {
  
  /**
   * Constructs the model.
   * 
   * @param json is an existing JSON model to initialize from (optional)
   */
  constructor(json) {
    super(json);
  }
}

module.exports = MoneroTxIncoming;