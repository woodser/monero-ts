/**
 * Base class for results from checking a transaction or reserve proof.
 */
class MoneroCheck {

  getIsGood() {
    return this.isGood;
  }

  setIsGood(isGood) {
    this.isGood = isGood;
    return this;
  }
}

module.exports = MoneroCheck;