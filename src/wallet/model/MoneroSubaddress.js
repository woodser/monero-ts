const MoneroUtils = require("../../utils/MoneroUtils");

/**
 * Monero subaddress model.
 */
class MoneroSubaddress {
  
  constructor(address) {
    this.setAddress(address);
  }
  
  getAccountIndex() {
    return this.accountIndex;
  }

  setAccountIndex(accountIndex) {
    this.accountIndex = accountIndex;
    return this;
  }

  getIndex() {
    return this.index;
  }

  setIndex(index) {
    this.index = index;
    return this;
  }
  
  getAddress() {
    return this.address;
  }

  setAddress(address) {
    this.address = address;
    return this;
  }

  getLabel() {
    return this.label;
  }

  setLabel(label) {
    this.label = label;
    return this;
  }

  getBalance() {
    return this.balance;
  }

  setBalance(balance) {
    this.balance = balance;
    return this;
  }

  getUnlockedBalance() {
    return this.unlockedBalance;
  }

  setUnlockedBalance(unlockedBalance) {
    this.unlockedBalance = unlockedBalance;
    return this;
  }

  getNumUnspentOutputs() {
    return this.numUnspentOutputs;
  }

  setNumUnspentOutputs(numUnspentOutputs) {
    this.numUnspentOutputs = numUnspentOutputs;
    return this;
  }

  isUsed() {
    return this.isUsed;
  }

  setIsUsed(isUsed) {
    this.isUsed = isUsed;
    return this;
  }

  toString() {
    return this.toString(0);
  }
  
  getNumBlocksToUnlock() {
    return this.numBlocksToUnlock;
  }

  setNumBlocksToUnlock(numBlocksToUnlock) {
    this.numBlocksToUnlock = numBlocksToUnlock;
    return this;
  }
  
  toString(indent) {
    let str = "";
    str += MoneroUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += MoneroUtils.kvLine("Subaddress index", this.getIndex(), indent);
    str += MoneroUtils.kvLine("Address", this.getAddress(), indent);
    str += MoneroUtils.kvLine("Label", this.getLabel(), indent);
    str += MoneroUtils.kvLine("Balance", this.getBalance(), indent);
    str += MoneroUtils.kvLine("Unlocked balance", this.getUnlockedBalance(), indent);
    str += MoneroUtils.kvLine("Num unspent outputs", this.getNumUnspentOutputs(), indent);
    str += MoneroUtils.kvLine("Is used", this.isUsed(), indent);
    str += MoneroUtils.kvLine("Num blocks to unlock", this.isUsed(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroSubaddress;