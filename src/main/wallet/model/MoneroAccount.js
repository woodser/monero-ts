const assert = require("assert");

/**
 * Monero account model.
 */
class MoneroAccount {
  
  constructor(index, primaryAddress, balance, unlockedBalance, subaddresses) {
    this.state = {};
    this.setIndex(index);
    this.setPrimaryAddress(primaryAddress);
    this.setBalance(balance);
    this.setUnlockedBalance(unlockedBalance);
    this.setSubaddresses(subaddresses);
  }
  
  getIndex() {
    return this.state.index;
  }
  
  setIndex(index) {
    this.state.index = index;
    return this;
  }
  
  getPrimaryAddress() {
    return this.state.primaryAddress;
  }

  setPrimaryAddress(primaryAddress) {
    this.state.primaryAddress = primaryAddress;
    return this;
  }
  
  getBalance() {
    return this.state.balance;
  }
  
  setBalance(balance) {
    this.state.balance = balance;
    return this;
  }
  
  getUnlockedBalance() {
    return this.state.unlockedBalance;
  }
  
  setUnlockedBalance(unlockedBalance) {
    this.state.unlockedBalance = unlockedBalance;
    return this;
  }
  
  getTag() {
    return this.state.tag;
  }
  
  setTag(tag) {
    this.state.tag = tag;
    return this;
  }
  
  getSubaddresses() {
    return this.state.subaddresses;
  }
  
  setSubaddresses(subaddresses) {
    assert(subaddresses === undefined || Array.isArray(subaddresses), "Given subaddresses must be undefined or an array of subaddresses");
    this.state.subaddresses = subaddresses;
    if (subaddresses != null) {
      for (let subaddress of subaddresses) {
        subaddress.setAccountIndex(this.state.index);
      }
    }
    return this;
  }
}

module.exports = MoneroAccount;