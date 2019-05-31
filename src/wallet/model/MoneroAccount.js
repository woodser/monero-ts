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
    return this;
  }
  
  getPrimaryAddress() {
    return this.json.primaryAddress;
  }

  setPrimaryAddress(primaryAddress) {
    this.json.primaryAddress = primaryAddress;
    return this;
  }

  getLabel() {
    return this.json.label;
  }
  
  setLabel(label) {
    this.json.label = label;
    return this;
  }
  
  getBalance() {
    return this.json.balance;
  }
  
  setBalance(balance) {
    this.json.balance = balance;
    return this;
  }
  
  getUnlockedBalance() {
    return this.json.unlockedBalance;
  }
  
  setUnlockedBalance(unlockedBalance) {
    this.json.unlockedBalance = unlockedBalance;
    return this;
  }
  
  getTag() {
    return this.json.tag;
  }
  
  setTag(tag) {
    this.json.tag = tag;
    return this;
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
    return this;
  }
}

module.exports = MoneroAccount;