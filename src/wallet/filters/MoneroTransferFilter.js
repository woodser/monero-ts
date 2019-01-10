const MoneroSubaddressFilter = require("./MoneroSubaddressFilter");

/**
 * Filters transfers by their attributes.
 * 
 * Transfers are only filtered if they don't match any fields that are set in
 * the filter.
 */
class MoneroTransferFilter extends MoneroSubaddressFilter {
  
  getIsOutgoing() {
    return this.isOutgoing;
  }
  
  setIsOutgoing(isOutgoing) {
    this.isOutgoing = isOutgoing;
  }
}

module.exports = MoneroTransferFilter;