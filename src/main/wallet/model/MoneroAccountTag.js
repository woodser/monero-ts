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
    return this;
  }
  
  getLabel() {
    return this.label;
  }
  
  setLabel(label) {
    this.label = label;
    return this;
  }
  
  getAccountIndices() {
    return this.accountIndices;
  }
  
  setAccountIndices(accountIndices) {
    this.accoutIndices = accountIndices;
    return this;
  }
}

module.exports = MoneroAccountTag;