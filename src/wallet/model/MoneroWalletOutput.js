const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroOutput = require("../../daemon/model/MoneroOutput");

/**
 * Models a Monero output with wallet extensions.
 */
class MoneroWalletOutput extends MoneroOutput {
  
  constructor(json) {
    super(json);
  }
  
  getAccountIndex() {
    return this.state.accountIndex;
  }

  setAccountIndex(accountIndex) {
    this.state.accountIndex = accountIndex;
  }

  getSubaddressIndex() {
    return this.state.subaddressIndex;
  }

  setSubaddressIndex(subaddressIndex) {
    this.state.subaddressIndex = subaddressIndex;
  }
  
  merge(output) {
    super.merge(output);
    this.setAccountIndex(MoneroUtils.reconcile(this.getAccountIndex(), output.getAccountIndex()));
    this.setSubaddressIndex(MoneroUtils.reconcile(this.getSubaddressIndex(), output.getSubaddressIndex()));
  }
  
  toString(indent) {
    let str = super.toString(indent) + "\n"
    str += MoneroUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += MoneroUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroWalletOutput;