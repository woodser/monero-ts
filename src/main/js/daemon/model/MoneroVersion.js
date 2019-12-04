/**
 * Models a Monero version.
 */
class MoneroVersion {
  
  /**
   * Construct the model.
   * 
   * @param number is the version number
   * @param isRelease indicates if this version is a release
   */
  constructor(number, isRelease) {
    this.state = {};
    this.state.number = number;
    this.state.isRelease = isRelease;
  }

  getNumber() {
    return this.state.number;
  }

  setNumber(number) {
    this.state.number = number;
    return this;
  }

  isRelease() {
    return this.state.isRelease;
  }

  setIsRelease(isRelease) {
    this.state.isRelease = isRelease;
    return this;
  }
  
  copy() {
    return new MoneroKeyImage(this);
  }
  
  toJson() {
    return Object.assign({}, this.state);
  }
}

module.exports = MoneroVersion;