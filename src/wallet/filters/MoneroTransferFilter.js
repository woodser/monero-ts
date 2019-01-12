assert = require("assert");
const MoneroTransfer = require("../model/MoneroTransfer");

/**
 * Filters transfers by their attributes.
 * 
 * Only filters items that don't match a criteria in the filter.
 */
class MoneroTransferFilter extends MoneroTransfer {
  
  getIsOutgoing() {
    return this.isOutgoing;
  }
  
  setIsOutgoing(isOutgoing) {
    this.isOutgoing = isOutgoing;
    return this;
  }
  
  getIsIncoming() {
    return this.isOutgoing === undefined ? undefined : !this.isOutgoing;
  }
  
  setIsIncoming(isIncoming) {
    return this.setIsOutgoing(isIncoming === undefined ? undefined : !isIncoming);
  }
  
  getHasDestinations() {
    return this.hasDestinations;
  }
  
  setHasDestinations(hasDestinations) {
    this.hasDestinations = hasDestinations;
    return this;
  }
  
  meetsCriteria(transfer) {
    assert(transfer instanceof MoneroTransfer);
    if (!super.meetsCriteria(transfer)) return false;
    if (this.getIsIncoming() !== undefined && this.getIsIncoming() !== transfer.getIsIncoming()) return false;
    if (this.getIsOutgoing() !== undefined && this.getIsOutgoing() !== transfer.getIsOutgoing()) return false;
    if (this.getHasDestinations() !== undefined) {
      if (this.getHasDestinations() && transfer.getDestinations() === undefined) return false;
      if (!this.getHasDestinations() && transfer.getDestinations() !== undefined) return false;
    }
    return true;
  }
}

module.exports = MoneroTransferFilter;