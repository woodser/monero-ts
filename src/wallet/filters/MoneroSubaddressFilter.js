const Filter = require("../../utils/Filter");

/**
 * Filters based on account and subaddress indices.
 */
class MoneroSubaddressFilter extends Filter {
  
  getAccountIndex() {
    return this.accountIndex;
  }

  setAccountIndex(accountIndex) {
    this.accountIndex = accountIndex;
  }

  getSubaddressIndices() {
    return this.subaddressIndices;
  }

  setSubaddressIndices(subaddressIndices) {
    this.subaddressIndices = subaddressIndices;
  }
  
  meetsCriteria(param) {
    throw new Error("Not implemented");
  }
}

module.exports = MoneroSubaddressFilter;