const assert = require("assert");

/**
 * Monero account model.
 */
class MoneroAccount {
  
  constructor(index, primaryAddress, label, balance, unlockedBalance, subaddresses) {
    this.json = {};
    this.setIndex(index);
    this.setPrimaryAddress(primaryAddress);
    this.setLabel(label);
    this.setBalance(balance);
    this.setUnlockedBalance(unlockedBalance);
    this.setSubaddresses(subaddresses);
  }
  
  getIndex() {
    return this.json.index;
  }
  
  setIndex(index) {
    this.json.index = index;
  }
  
  getPrimaryAddress() {
    return this.json.primaryAddress;
  }

  setPrimaryAddress(primaryAddress) {
    this.json.primaryAddress = primaryAddress;
  }

  getLabel() {
    return this.json.label;
  }
  
  setLabel(label) {
    this.json.label = label;
  }
  
  getBalance() {
    return this.json.balance;
  }
  
  setBalance(balance) {
    this.json.balance = balance;
  }
  
  getUnlockedBalance() {
    return this.json.unlockedBalance;
  }
  
  setUnlockedBalance(unlockedBalance) {
    this.json.unlockedBalance = unlockedBalance;
  }
  
  getSubaddresses() {
    return this.json.subaddresses;
  }
  
  setSubaddresses(subaddresses) {
    assert(subaddresses === undefined || Array.isArray(subaddresses), "Given subaddresses must be undefined or an array of subaddresses");
    this.json.subaddresses = subaddresses;
    if (subaddresses != null) {
      for (let subaddress of subaddresses) {
        subaddress.setAccountIndex(this.json.index);
      }
    }
  }
}

module.exports = MoneroAccount;