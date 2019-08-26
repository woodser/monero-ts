const Filter = require("../../utils/Filter");
const MoneroOutputWallet = require("../model/MoneroOutputWallet");

/**
 * Configures a request to retrieve wallet outputs (i.e. outputs that the wallet has or had the
 * ability to spend).
 * 
 * All outputs are returned except those that do not meet the criteria defined in this request.
 */
class MoneroOutputRequest extends MoneroOutputWallet {
  
  /**
   * Constructs the request.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    
    // deserialize if necessary
    if (this.state.txRequest && !(this.state.txRequest instanceof MoneroTxRequest)) this.state.txRequest = new MoneroTxRequest(this.state.transferRequest);
  }
  
  getSubaddressIndices() {
    return this.state.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices) {
    this.state.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getTxRequest() {
    return this.state.txRequest;
  }
  
  setTxRequest(txRequest) {
    this.state.txRequest = txRequest;
    return this;
  }
  
  meetsCriteria(output) {
    if (!(output instanceof MoneroOutputWallet)) return false;
    
    // filter on output
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== output.getAccountIndex()) return false;
    if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== output.getSubaddressIndex()) return false;
    if (this.getAmount() !== undefined && this.getAmount().compare(output.getAmount()) !== 0) return false;
    if (this.isSpent() != undefined && this.isSpent() !== output.isSpent()) return false;
    if (this.isUnlocked() !== undefined && this.isUnlocked() !== output.isUnlocked()) return false;
    
    // filter on output's key image
    if (this.getKeyImage() !== undefined) {
      if (output.getKeyImage() === undefined) return false;
      if (this.getKeyImage().getHex() !== undefined && this.getKeyImage().getHex() !== output.getKeyImage().getHex()) return false;
      if (this.getKeyImage().getSignature() !== undefined && this.getKeyImage().getSignature() !== output.getKeyImage().getSignature()) return false;
    }
    
    // filter on extensions
    if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(output.getSubaddressIndex())) return false;
    
    // filter with tx request
    if (this.getTxRequest() && !this.getTxRequest().meetsCriteria(output.getTx())) return false;
    
    // output meets request
    return true;
  }
}

module.exports = MoneroOutputRequest;