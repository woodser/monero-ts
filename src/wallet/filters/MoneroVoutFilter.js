const MoneroWalletOutput = require("../model/MoneroWalletOutput");
const MoneroSubaddressFilter = require("./MoneroSubaddressFilter");

/**
 * Filters vouts by their attributes.
 * 
 * Only filters items that don't match a criteria in the filter.
 */
class MoneroVoutFilter extends MoneroSubaddressFilter {
  
  getIsSpent() {
    return this.isSpent;
  }

  setIsSpent(isSpent) {
    this.isSpent = isSpent;
    return this;
  }
  
  meetsCriteria(vout) {
    assert(vout instanceof MoneroWalletOutput);
    if (!super.meetsCriteria(vout)) return false;
    if (this.getIsSpent() !== undefined && this.getIsSpent() !== vout.getIsSpent()) return false;
    return true;
  }
}

module.exports = MoneroVoutFilter;