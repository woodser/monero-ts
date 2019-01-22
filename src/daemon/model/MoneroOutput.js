const MoneroUtils = require("../../utils/MoneroUtils");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroKeyImage = require("./MoneroKeyImage");

/**
 * Represents a transaction output.
 * 
 * TODO: instantiate from daemon block vouts
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
    if (state.keyImage && !(state.keyImage instanceof MoneroKeyImage)) state.keyImage = new MoneroKeyImage(state.keyImage);
  }
  
  getTx() {
    return this.state.tx;
  }
  
  setTx(tx) {
    this.state.tx = tx;
    return this;
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
  
  getRingOutputIndices() {
    return this.state.ringOutputIndices;
  }
  
  setRingOutputIndices(ringOutputIndices) {
    this.state.ringOutputIndices = ringOutputIndices;
    return this;
  }
  
  copy() {
    return new MoneroOutput(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getAmount()) json.amount = this.getAmount() ? this.getAmount().toString() : undefined;
    if (this.getKeyImage()) json.keyImage = this.getKeyImage() ? this.getKeyImage().toJson() : undefined;
    delete json.tx;
    return json;
  }
  
  toString(indent = 0) {
    let str = "";
    if (this.getKeyImage()) {
      str += MoneroUtils.kvLine("Key image", "", indent);
      str += this.getKeyImage().toString(indent + 1) + "\n";
    }
    str += MoneroUtils.kvLine("Amount", this.getAmount(), indent);
    str += MoneroUtils.kvLine("Index", this.getIndex(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
  
  merge(output) {
    assert(output instanceof MoneroOutput);
    if (this === output) return;
    if (this.getKeyImage() === undefined) this.setKeyImage(output.getKeyImage());
    else if (output.getKeyImage() !== undefined) this.getKeyImage().merge(output.getKeyImage());
    this.setAmount(MoneroUtils.reconcile(this.getAmount(), output.getAmount()));
    this.setIndex(MoneroUtils.reconcile(this.getIndex(), output.getIndex()));
  }
}

module.exports = MoneroOutput;