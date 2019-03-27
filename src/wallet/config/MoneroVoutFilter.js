const Filter = require("../../utils/Filter");
const MoneroOutputWallet = require("../model/MoneroOutputWallet");

/**
 * Filters transfers that don't match initialized filter criteria.
 */
class MoneroVoutFilter extends MoneroOutputWallet {
  
  /**
   * Constructs the filter.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    
    // deserialize if necessary
    if (this.state.txFilter && !(this.state.txFilter instanceof MoneroTxFilter)) this.state.txFilter = new MoneroTxFilter(this.state.transferFilter);
  }
  
  getSubaddressIndices() {
    return this.state.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices) {
    this.state.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getTxFilter() {
    return this.state.txFilter;
  }
  
  setTxFilter(txFilter) {
    this.state.txFilter = txFilter;
    return this;
  }
  
  meetsCriteria(vout) {
    if (!(vout instanceof MoneroOutputWallet)) return false;
    
    // filter on vout
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== vout.getAccountIndex()) return false;
    if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== vout.getSubaddressIndex()) return false;
    if (this.getAmount() !== undefined && this.getAmount().compare(vout.getAmount()) !== 0) return false;
    if (this.getIsSpent() !== undefined && this.getIsSpent() !== vout.getIsSpent()) return false;
    if (this.getKeyImage() !== undefined && this.getKeyImage() !== vout.getKeyImage()) return false;  // TODO: bug: shouldn't compare by refererence, add test to catch 
    
    // filter extensions
    if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(vout.getSubaddressIndex())) return false;
    
    // filter with transaction filter
    if (this.getTxFilter() && !this.getTxFilter().meetsCriteria(vout.getTx())) return false;
    
    // vout meets filter criteria
    return true;
  }
}

module.exports = MoneroVoutFilter;