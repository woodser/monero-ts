const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroOutput = require("../../daemon/model/MoneroOutput");

/**
 * Models a Monero output with wallet extensions.
 * 
 * TODO: update this to state model
 */
class MoneroWalletOutput extends MoneroOutput {
  
  /**
   * Constructs the model.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    state = this.state;
    
    // deserialize fields if necessary
    if (state.amount && !(state.amount instanceof BigInteger)) state.amount = BigInteger.parse(state.amount);
  }
  
  getTx() {
    return this.state.tx;
  }
  
  setTx(tx) {
    this.state.tx = tx;
    return this;
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
  }
  
  toString(indent) {
    let str = super.toString(indent) + "\n"
    str += MoneroUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += MoneroUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Is spent", this.getIsSpent(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroWalletOutput;