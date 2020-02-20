/**
 * Models results from importing key images.
 */
class MoneroKeyImageImportResult {
  
  constructor(state) {
    state = Object.assign({}, state);
    if (state.spentAmount !== undefined && !(state.spentAmount instanceof BigInteger)) state.spentAmount = BigInteger.parse(state.spentAmount);
    if (state.unspentAmount !== undefined && !(state.unspentAmount instanceof BigInteger)) state.unspentAmount = BigInteger.parse(state.unspentAmount);
    this.state = state;
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getSpentAmount()) json.spentAmount = this.getSpentAmount().toString();
    if (this.getUnspentAmount()) json.unspentAmount = this.getUnspentAmount().toString();
    return json;
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
    return this;
  }
  
  getSpentAmount() {
    return this.spentAmount;
  }
  
  setSpentAmount(spentAmount) {
    this.spentAmount = spentAmount;
    return this;
  }
  
  getUnspentAmount() {
    return this.unspentAmount;
  }
  
  setUnspentAmount(unspentAmount) {
    this.unspentAmount = unspentAmount;
    return this;
  }
}

module.exports = MoneroKeyImageImportResult;