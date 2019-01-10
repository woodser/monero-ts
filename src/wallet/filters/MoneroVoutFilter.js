MoneroSubaddressFilter = require("./MoneroSubaddressFilter");

/**
 * Filters vouts by their attributes.
 * 
 * Vouts are only filtered if they don't match any fields that are set in the
 * filter.
 */
class MoneroVoutFilter extends MoneroSubaddressFilter {
  
  getIsSpent() {
    return this.state.isSpent;
  }

  setIsSpent(isSpent) {
    this.state.isSpent = isSpent;
  }
}

module.exports = MoneroVoutFilter;