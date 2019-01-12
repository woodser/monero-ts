const Filter = require("../../utils/Filter");
const MoneroWalletOutput = require("../model/MoneroWalletOutput");

/**
 * Filters vouts by their attributes.
 * 
 * Only filters items that don't match a criteria in the filter.
 */
class MoneroVoutFilter extends Filter {
  
  meetsCriteria(vout) {
    assert(vout instanceof MoneroWalletOutput);
    if (!super.meetsCriteria(vout)) return false;
    if (this.getIsSpent() !== undefined && this.getIsSpent() !== vout.getIsSpent()) return false;
    return true;
  }
}

module.exports = MoneroVoutFilter;