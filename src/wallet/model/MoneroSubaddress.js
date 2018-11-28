
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
  }

  getSubaddrIndex() {
    return this.subaddrIndex;
  }

  setSubaddrIndex(subaddrIndex) {
    this.subaddrIndex = subaddrIndex;
  }

  getLabel() {
    return this.label;
  }

  setLabel(label) {
    this.label = label;
  }

  getAddress() {
    return this.address;
  }

  setAddress(address) {
    this.address = address;
  }

  getBalance() {
    return this.balance;
  }

  setBalance(balance) {
    this.balance = balance;
  }

  getUnlockedBalance() {
    return this.unlockedBalance;
  }

  setUnlockedBalance(unlockedBalance) {
    this.unlockedBalance = unlockedBalance;
  }

  getNumUnspentOutputs() {
    return this.numUnspentOutputs;
  }

  setNumUnspentOutputs(numUnspentOutputs) {
    this.numUnspentOutputs = numUnspentOutputs;
  }

  getIsUsed() {
    return this.isUsed;
  }

  setIsUsed(isUsed) {
    this.isUsed = isUsed;
  }

  toString() {
    return this.toString(0);
  }
  
  toString(offset) {
    throw new Error("Not implemented");
//    StringBuilder sb = new StringBuilder();
//    sb.append(StringUtils.getTabs(offset) + "address: " + address + "\n");
//    sb.append(StringUtils.getTabs(offset) + "index: [" + accountIndex + ", " + subaddrIndex + "]\n");
//    sb.append(StringUtils.getTabs(offset) + "label: " + label + "\n");
//    sb.append(StringUtils.getTabs(offset) + "balance: " + balance + "\n");
//    sb.append(StringUtils.getTabs(offset) + "unlockedBalance: " + unlockedBalance + "\n");
//    sb.append(StringUtils.getTabs(offset) + "numUnspentOutputs: " + numUnspentOutputs);
//    return sb.toString();
  }
}

module.exports = MoneroSubaddress;