const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroOutput = require("../../daemon/model/MoneroOutput");

/**
 * Models a Monero output with wallet extensions.
 */
class MoneroWalletOutput extends MoneroOutput {
  
  /**
   * Constructs the model.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
  }
  
  getAccountIndex() {
    return this.state.accountIndex;
  }

  setAccountIndex(accountIndex) {
    this.state.accountIndex = accountIndex;
    return this;
  }

  getSubaddressIndex() {
    return this.state.subaddressIndex;
  }

  setSubaddressIndex(subaddressIndex) {
    this.state.subaddressIndex = subaddressIndex;
    return this;
  }
  
  getIsSpent() {
    return this.state.isSpent;
  }

  setIsSpent(isSpent) {
    this.state.isSpent = isSpent;
    return this;
  }
  
  copy() {
    return new MoneroWalletOutput(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state, super.toJson());
    delete json.tx;
    return json;
  }
  
  toString(indent) {
    let str = super.toString(indent) + "\n"
    str += MoneroUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += MoneroUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Is spent", this.getIsSpent(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
  
  /**
   * Updates this output by merging the latest information from the given
   * output.
   * 
   * Merging can modify or build references to the output given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @param output is the output to merge into this one
   */
  merge(output) {
    assert(output instanceof MoneroWalletOutput);
    if (this === output) return;
    super.merge(output);
    
    // merge transactions if they're different which comes back to merging outputs
    if (this.getTx() !== output.getTx()) this.getTx().merge(output.getTx());
    
    // otherwise merge output fields
    else {
      this.setAccountIndex(MoneroUtils.reconcile(this.getAccountIndex(), output.getAccountIndex()));
      this.setSubaddressIndex(MoneroUtils.reconcile(this.getSubaddressIndex(), output.getSubaddressIndex()));
      this.setIsSpent(MoneroUtils.reconcile(this.getIsSpent(), output.getIsSpent(), {resolveTrue: true})); // output can become spent
    }
    
    return this;
  }
}

module.exports = MoneroWalletOutput;