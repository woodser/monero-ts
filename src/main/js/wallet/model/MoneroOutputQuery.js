/**
 * Configures a query to retrieve wallet outputs (i.e. outputs that the wallet has or had the
 * ability to spend).
 * 
 * All outputs are returned except those that do not meet the criteria defined in this query.
 * 
 * @extends {MoneroOutputWallet}
 */
class MoneroOutputQuery extends MoneroOutputWallet {
  
  /**
   * Constructs the query.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    
    // deserialize if necessary
    if (this.state.minAmount !== undefined && !(this.state.minAmount instanceof BigInteger)) this.state.minAmount = BigInteger.parse(this.state.minAmount);
    if (this.state.maxAmount !== undefined && !(this.state.maxAmount instanceof BigInteger)) this.state.maxAmount = BigInteger.parse(this.state.maxAmount);
    if (this.state.txQuery && !(this.state.txQuery instanceof MoneroTxQuery)) this.state.txQuery = new MoneroTxQuery(this.state.outputQuery);
  }
  
  copy() {
    return new MoneroOutputQuery(this);
  }
  
  toJson() {
    let json = Object.assign({}, this.state, super.toJson());
    if (this.getMinAmount()) json.minAmount = this.getMinAmount().toString();
    if (this.getMaxAmount()) json.maxAmount = this.getMaxAmount().toString();
    delete json.txQuery;
    return json;
  }
  
  getMinAmount() {
    return this.state.minAmount;
  }

  setMinAmount(minAmount) {
    this.state.minAmount = minAmount;
    return this;
  }

  getMaxAmount() {
    return this.state.maxAmount;
  }

  setMaxAmount(maxAmount) {
    this.state.maxAmount = maxAmount;
    return this;
  }
  
  getTxQuery() {
    return this.state.txQuery;
  }
  
  setTxQuery(txQuery) {
    this.state.txQuery = txQuery;
    return this;
  }
  
  getSubaddressIndices() {
    return this.state.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices) {
    this.state.subaddressIndices = subaddressIndices;
    return this;
  }
  
  /**
   * Indicates if the this query will fetch locked outputs, unlocked outputs, or both (null).
   * 
   * @return true if locked outputs queried, false of unlocked outputs queried, undefined if both
   */
  isLocked() {
    if (this.state.txQuery === undefined) return undefined;
    return txQuery.isLocked();
  }
  
  /**
   * Convenience method to query outputs by the locked state of their tx.
   * 
   * @param isLocked specifies if the output's tx must be locked or unlocked (optional)
   * @return {MoneroOutputQuery} this query for chaining
   */
  setIsLocked(isLocked) {
    if (this.state.txQuery === undefined) this.state.txQuery = new MoneroTxQuery();
    this.state.txQuery.setIsLocked(isLocked);
    return this;
  }
  
  meetsCriteria(output) {
    if (!(output instanceof MoneroOutputWallet)) return false;
    
    // filter on output
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== output.getAccountIndex()) return false;
    if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== output.getSubaddressIndex()) return false;
    if (this.getAmount() !== undefined && this.getAmount().compare(output.getAmount()) !== 0) return false;
    if (this.isSpent() != undefined && this.isSpent() !== output.isSpent()) return false;
    
    // filter on output's key image
    if (this.getKeyImage() !== undefined) {
      if (output.getKeyImage() === undefined) return false;
      if (this.getKeyImage().getHex() !== undefined && this.getKeyImage().getHex() !== output.getKeyImage().getHex()) return false;
      if (this.getKeyImage().getSignature() !== undefined && this.getKeyImage().getSignature() !== output.getKeyImage().getSignature()) return false;
    }
    
    // filter on extensions
    if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(output.getSubaddressIndex())) return false;
    
    // filter with tx query
    if (this.getTxQuery() && !this.getTxQuery().meetsCriteria(output.getTx())) return false;
    
    // filter on remaining fields
    if (this.getMinAmount() !== undefined && (output.getAmount() === undefined || output.getAmount().compare(this.getMinAmount()) < 0)) return false;
    if (this.getMaxAmount() !== undefined && (output.getAmount() === undefined || output.getAmount().compare(this.getMaxAmount()) > 0)) return false;
    
    // output meets query
    return true;
  }
  
  isDefault() {
    return this.meetsCriteria(MoneroOutputQuery._EMPTY_OUTPUT);
  }
}

MoneroOutputQuery._EMPTY_OUTPUT = new MoneroOutputWallet();

module.exports = MoneroOutputQuery;