const MoneroUtils = require("../../utils/MoneroUtils");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

/**
 * Represents a transaction output.
 */
class MoneroOutput {
  
  /**
   * Constructs the model.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    state = Object.assign({}, state);
    this.state = state;
    
    // deserialize fields if necessary
    if (state.amount && !(state.amount instanceof BigInteger)) state.amount = BigInteger.parse(state.amount);
  }
  
  getKeyImage() {
    return this.state.keyImage;
  }

  setKeyImage(keyImage) {
    this.state.keyImage = keyImage;
    return this;
  }
  
  getAmount() {
    return this.state.amount;
  }

  setAmount(amount) {
    this.state.amount = amount;
    return this;
  }
  
  getIndex() {
    return this.state.index;
  }
  
  setIndex(index) {
    this.state.index = index;
    return this;
  }
  
  copy() {
    return new MoneroOutput(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getAmount()) json.amount = this.getAmount().toString();
    return json;
  }
  
  merge(output) {
    this.setKeyImage(MoneroUtils.reconcile(this.getKeyImage(), output.getKeyImage()));
    this.setAmount(MoneroUtils.reconcile(this.getAmount(), output.getAmount()));
    this.setIndex(MoneroUtils.reconcile(this.getIndex(), output.getIndex()));
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Key image", this.getKeyImage(), indent);
    str += MoneroUtils.kvLine("Amount", this.getAmount(), indent);
    str += MoneroUtils.kvLine("Index", this.getIndex(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroOutput;