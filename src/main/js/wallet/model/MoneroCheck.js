/**
 * Base class for results from checking a transaction or reserve proof.
 * 
 * @class
 */
class MoneroCheck {
  
  constructor(state) {
    this.state = Object.assign({}, state);
  }

  isGood() {
    return this.state.isGood;
  }

  setIsGood(isGood) {
    this.state.isGood = isGood;
    return this;
  }
}

module.exports = MoneroCheck;