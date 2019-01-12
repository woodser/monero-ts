const Filter = require("../../utils/Filter");

/**
 * Filters subaddresses by their attributes.
 * 
 * Only filters items that don't match a criteria in the filter.
 */
class MoneroSubaddressFilter extends MoneroFilter {
  
  getAccountIndex() {
    return this.accountIndex;
  }

  setAccountIndex(accountIndex) {
    this.accountIndex = accountIndex;
    return this;
  }

  getSubaddressIndices() {
    return this.subaddressIndices;
  }

  setSubaddressIndices(subaddressIndices) {
    this.subaddressIndices = subaddressIndices;
    return this;
  }
  
  meetsCriteria(param) {
    
    // match account
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== param.getAccountIndex()) return false;
    
    // match any subaddress index
    if (this.getSubaddressIndices() !== undefined) {
      let found = false;
      for (let subaddressIdx of this.getSubaddressIndices()) {
        if (subaddressIdx === param.getSubaddressIndex()) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    
    // meets filter's criteria
    return true;
  }
}

module.exports = MoneroSubaddressFilter;