const Filter = require("../../utils/Filter");
const MoneroWalletOutput = require("../model/MoneroWalletOutput");

/**
 * Filters transfers that don't match initialized filter criteria.
 */
class MoneroVoutFilter extends Filter {
  
  /**
   * Constructs the filter.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super();
    state = Object.assign({}, state);
    this.state = state;
    if (!state.vout) state.vout = new MoneroWalletOutput(state);
    
    // deserialize if necessary
    if (state.txFilter && !(state.txFilter instanceof MoneroTxFilter)) state.txFilter = new MoneroTxFilter(state.transferFilter);
    if (!(state.vout instanceof MoneroWalletOutput)) state.vout = new MoneroWalletOutput(state.vout);
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
  
  getVout() {
    return this.state.vout;
  }
  
  setVout(vout) {
    this.state.vout = vout;
    return this;
  }
  
  meetsCriteria(vout) {
    if (!(vout instanceof MoneroWalletOutput)) return false;

    // filter on vout
    if (this.getVout()) {
      let vt = this.getVout();
      if (vt.getAccountIndex() !== undefined && vt.getAccountIndex() !== vout.getAccountIndex()) return false;
      if (vt.getSubaddressIndex() !== undefined && vt.getSubaddressIndex() !== vout.getSubaddressIndex()) return false;
      if (vt.getAmount() !== undefined && vt.getAmount().compare(vout.getAmount()) !== 0) return false;
      if (vt.getIsSpent() !== undefined && vt.getIsSpent() !== vout.getIsSpent()) return false;
      if (vt.getKeyImage() !== undefined && vt.getKeyImage() !== vout.getKeyImage()) return false;
      // TODO: expand this list
    }
    
    // filter extensions
    if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(vout.getSubaddressIndex())) return false;
    
    // filter with transaction filter
    if (this.getTxFilter() && !this.getTxFilter().meetsCriteria(vout.getTx())) return false;
    
    // vout meets filter criteria
    return true;
  }
}

module.exports = MoneroVoutFilter;