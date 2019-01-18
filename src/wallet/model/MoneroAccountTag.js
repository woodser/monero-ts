/**
 * Represents an account tag.
 */
class MoneroAccountTag {
  
  constructor(tag, label, accountIndices) {
    this.tag = tag;
    this.label = label;
    this.accountIndices = accountIndices;
  }
  
  getTag() {
    return this.tag;
  }
  
  setTag(tag) {
    this.tag = tag;
  }
  
  getLabel() {
    return this.label;
  }
  
  setLabel(label) {
    this.label = label;
  }
  
  getAccountIndices() {
    return this.accountIndices;
  }
  
  setAccountIndices(accountIndices) {
    this.accoutIndices = accountIndices;
  }
}

module.exports = MoneroAccountTag;